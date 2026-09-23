var file = "/dev/ttyUSB0";
const { std, pow, mean, sqrt } = require("mathjs");

const SerialPort = require("serialport");
const parsers = SerialPort.parsers;

var sqlite3 = require("sqlite3").verbose();
//cria o banco de dados, se nao existir
var db = new sqlite3.Database("dados.db");

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

//conecta ao banco de dados
var db = new sqlite3.Database("dados.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Connected to the dados.db");
});

var sql = "PRAGMA synchronous=OFF";
db.run(sql);

const parser = new parsers.Readline({
    delimiter: "\r\n",
});

const port = new SerialPort(file, {
    baudRate: 115200,
});

port.pipe(parser);

var GPS = require("gps");
var gps = new GPS();

var controle = null;
var time;
var TAXA = 0.1;
var DISP = 0.5;
var MIN_QTDE = (60 / TAXA) * DISP;

db.serialize(function () {
    //teste 1 - terminal
    var stmt = db.prepare(
        "INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES(?,?,?,?,?,?,?)",
    );

    gps.on("data", function (data) {
        if (data.time != undefined) {
            time = data.time;
            latitude = data.lat;
            longitude = data.lon;
        }

        if (data.msgNumber != undefined && data.msgNumber != "null") {
            for (var i = 0; i < data.satellites.length; i++) {
                //console.log(data);

                //console.log(data.satellites[i].prn + " - " + data.satellites[i].snr
                // + " - " + data.satellites[i].azimuth + " - " + data.satellites[i].elevation + " - " + time.toISOString());

                //teste 3
                //stmt = db.prepare("INSERT INTO prninfo (prn, snr, azi, elev, time) VALUES(?,?,?,?,?)");
                stmt.run(
                    data.satellites[i].prn,
                    data.satellites[i].snr,
                    data.satellites[i].azimuth,
                    data.satellites[i].elevation,
                    latitude,
                    longitude,
                    time,
                );
                //stmt.finalize();
            }
        }

        // console.log("time.getUTCSeconds = "+time.getUTCSeconds());
        // console.log("controle"+controle);
        //if (time.getUTCSeconds() >= 0 && time.getUTCSeconds() < SEGUNDOS && time.getMinutes() != controle) {

        if (time.getUTCSeconds() == 0 && time.getMinutes() != controle) {
            controle = time.getMinutes();

            var stmt2 =
                "select prn, count(snr) as total from prninfo where time between ?-60000 and ? group by prn";

            // console.log("time = "+time.toISOString());
            // var tempo = time-60000;
            // console.log("time - 60000 = "+tempo);

            db.all(stmt2, [time, time], (err, rows) => {
                console.log("db.all");
                if (err) {
                    throw err;
                } else {
                    console.log("varrer linhas");
                    rows.forEach((row) => {
                        //console.log(row.prn + " total -->" + row.total);

                        if (row.total >= MIN_QTDE) {
                            var sql =
                                "SELECT prn, snr FROM prninfo where time between ?-60000 and ? and prn = ?";
                            var vSnr = [];
                            var vIntensidadeSinal = [];
                            var i = 0;
                            var intensidadeSinalQuadrado = 0;

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

                                var dpSnr = std(vSnr);
                                intensidadeSinalQuadrado =
                                    intensidadeSinalQuadrado / i;
                                var mediaIntensidadeSinalQuadrado =
                                    mean(vIntensidadeSinal);
                                var mediaIntensidadeSinalQuadrado = pow(
                                    mediaIntensidadeSinalQuadrado,
                                    2,
                                );
                                var s4 = sqrt(
                                    (intensidadeSinalQuadrado -
                                        mediaIntensidadeSinalQuadrado) /
                                        mediaIntensidadeSinalQuadrado,
                                );

                                //salvar na tabela prnindices
                                var stmt3 =
                                    "INSERT INTO prnindices (prn, mediasnr, mediaazi, mediaelev, tinicial, tfinal, dpsnr, s4) SELECT prn, " +
                                    "AVG(snr), AVG(azi), AVG(elev), min(time), max(time), ?, ? from prninfo where time between ?-60000 and ? and prn = ? group by prn";

                                db.all(
                                    stmt3,
                                    [dpSnr, s4, time, time, row.prn],
                                    (err, rows) => {
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
