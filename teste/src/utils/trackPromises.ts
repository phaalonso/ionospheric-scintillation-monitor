let count = 0;

export function trackPromises(promise) {
    count++;

    return promise.finally(() => {
        --count;
    });
}

// setInterval(() => {
//     console.log(`Promises: ${count}`);
// }, 1000 * 10);
