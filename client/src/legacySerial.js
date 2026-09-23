let file = "/dev/ttyUSB0";
const { std, pow, mean, sqrt } = require("mathjs");

const SerialPort = require("serialport");
const parsers = SerialPort.parsers;

function initializeDB() {
    let sqlite3 = require("sqlite3").verbose();
    //cria o banco de dados, se nao existir
    let db = new sqlite3.Database("dados.db");

    //cria as tabelas, se nao existir
    db.serialize(function () {
        db.run(
            "CREATE TABLE if not exists prninfo (prn INTEGER, snr REAL, azi REAL, elev REAL, lat REAl, long REAL, time TEXT)",
        );
        console.log("tabela prninfo");
    });

    db.serialize(function () {
        db.run(
            "CREATE TABLE if not exists prnindices (prn INTEGER, mediasnr REAL, mediaazi REAL, mediaelev REAL, tinicial TEXT, tfinal TEXT, dpsnr REAL, s4 REAL)",
        );
        console.log("tabela prnindice");
    });

    db.close();
}

initializeDB();

//conecta ao banco de dados
let db = new sqlite3.Database("dados.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Connected to the dados.db");
});

let sql = "PRAGMA synchronous=OFF";
db.run(sql);

const parser = new parsers.Readline({
    delimiter: "\r\n",
});

const port = new SerialPort(file, {
    baudRate: 115200,
});

port.pipe(parser);

let GPS = require("gps");
let gps = new GPS();

let controle = null;
let time;
let TAXA = 0.1;
let DISP = 0.5;
let MIN_QTDE = (60 / TAXA) * DISP;
let latitude;
let longitude;

db.serialize(function () {
    //teste 1 - terminal
    let stmt = db.prepare(
        "INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES(?,?,?,?,?,?,?)",
    );

    gps.on("data", function (data) {
        if (data.time !== undefined) {
            time = data.time;
            latitude = data.lat;
            longitude = data.lon;
        }

        if (data.msgNumber !== undefined && data.msgNumber !== "null") {
            for (const element of data.satellites) {
                stmt.run(
                    element.prn,
                    element.snr,
                    element.azimuth,
                    element.elevation,
                    latitude,
                    longitude,
                    time,
                );
            }
        }

        // console.log("time.getUTCSeconds = "+time.getUTCSeconds());
        // console.log("controle"+controle);
        //if (time.getUTCSeconds() >= 0 && time.getUTCSeconds() < SEGUNDOS && time.getMinutes() != controle) {

        if (time.getUTCSeconds() === 0 && time.getMinutes() !== controle) {
            controle = time.getMinutes();

            let stmt2 =
                "select prn, count(snr) as total from prninfo where time between ?-60000 and ? group by prn";

            // console.log("time = "+time.toISOString());
            // let tempo = time-60000;
            // console.log("time - 60000 = "+tempo);

            db.all(stmt2, [time, time], (err, rows) => {
                console.log("db.all");
                if (err) {
                    throw err;
                } else {
                    console.log("letrer linhas");
                    rows.forEach((row) => {
                        //console.log(row.prn + " total -->" + row.total);

                        if (row.total >= MIN_QTDE) {
                            let sql =
                                "SELECT prn, snr FROM prninfo where time between ?-60000 and ? and prn = ?";
                            let vSnr = [];
                            let vIntensidadeSinal = [];
                            let i = 0;
                            let intensidadeSinalQuadrado = 0;

                            db.all(sql, [time, time, row.prn], (err, rows) => {
                                if (err) {
                                    throw err;
                                }
                                rows.forEach((row) => {
                                    if (row.snr != null) {
                                        //console.log(row.prn + " -->" + row.snr);
                                        vSnr[i] = row.snr;
                                        vIntensidadeSinal[i] = pow(
                                            10,
                                            row.snr / 10,
                                        );
                                        intensidadeSinalQuadrado =
                                            intensidadeSinalQuadrado +
                                            pow(vIntensidadeSinal[i], 2);
                                        i++;
                                    }
                                });

                                let dpSnr = std(vSnr);
                                intensidadeSinalQuadrado =
                                    intensidadeSinalQuadrado / i;
                                let mediaIntensidadeSinalQuadrado =
                                    mean(vIntensidadeSinal);
                                mediaIntensidadeSinalQuadrado = pow(
                                    mediaIntensidadeSinalQuadrado,
                                    2,
                                );
                                let s4 = sqrt(
                                    (intensidadeSinalQuadrado -
                                        mediaIntensidadeSinalQuadrado) /
                                        mediaIntensidadeSinalQuadrado,
                                );

                                //sallet na tabela prnindices
                                let stmt3 =
                                    "INSERT INTO prnindices (prn, mediasnr, mediaazi, mediaelev, tinicial, tfinal, dpsnr, s4) SELECT prn, " +
                                    "AVG(snr), AVG(azi), AVG(elev), min(time), max(time), ?, ? from prninfo where time between ?-60000 and ? and prn = ? group by prn";

                                db.all(
                                    stmt3,
                                    [dpSnr, s4, time, time, row.prn],
                                    (err) => {
                                        if (err) {
                                            throw err;
                                        } else {
                                            console.log("add prnindice");
                                        }
                                    },
                                );
                            });
                        }
                    });
                }
            });
        }
    });
});

parser.on("data", function (data) {
    gps.update(data);
});
