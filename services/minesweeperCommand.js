"use strict";

module.exports.init = async function() {
    await global.commands.registerCommand(`mine`, {
        run: mine,
        //channelRatelimit: [3, 60000],
        helpCategory: `misc`,
        briefHelp: ` {size} {mines} - Generates a minesweeper grid.`,
        longHelp: ` [subreddit] {type} - 
Generates a minesweeper grid with the given size in lengthxwidth format and with mines amount of mines.
Example: ;;mine 10x10 5 would generate a 10x10 grid with 5 mines.`
    });
};

async function mine(message, type, mines) {
    let [width, height] = type ? type.toLowerCase().split(`x`) : [10, 10];
    mines = mines || 10;

    if (isNaN(width) || isNaN(height)) {
        await global.message.send(`INVALIDFIELDDIM`, message.channel);
        return;
    }

    if (width > 30 || width < 0 || height > 30 || height < 0) {
        await global.message.send(`INVALIDFIELDDIM`, message.channel);
        return;
    }

    if (width * height > 200) {
        await global.message.send(`EXCEEDEDMAXFIELDSIZE`, message.channel);
        return;
    }

    if (mines < 0 || mines > width * height * 0.3) {
        await global.message.send(`INVALIDMINE`, message.channel);
        return;
    }

    width = parseInt(width);
    height = parseInt(height);

    const field = [];
    field.length = width * height;
    field.fill(0);

    for (let i = 0; i < mines; i++) {
        let randomX = randomIntFromInterval(0, width - 1), randomY = randomIntFromInterval(0, height - 1);
        while (field[randomX + randomY * width] < 0) {
            randomX = randomIntFromInterval(0, width - 1), randomY = randomIntFromInterval(0, height - 1);
        }

        field[randomX + randomY * width] = -20; // Make it -20 so its still a bomb even if it gets incremented 8 times

        for (let y = -1; y <= 1; y++) {
            const randomYA = randomY + y;
            if (randomYA < 0 || randomYA >= height) {
                continue;
            }

            for (let x = -1; x <= 1; x++) {
                if (x === 0 && y === 0) {
                    continue;
                }

                const randomXA = randomX + x;
                if (randomXA < 0 || randomXA >= width) {
                    continue;
                }

                field[randomXA + randomYA * width]++;
            }
        }
    }

    let fieldString = `.\n`;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (field[x + y * width] < 0) {
                fieldString += `||:boom:||`;
            } else {
                switch(field[x + y * width]) {
                    case 0:
                        fieldString += `||:zero:||`;
                        break;
                    case 1:
                        fieldString += `||:one:||`;
                        break;
                    case 2:
                        fieldString += `||:two:||`;
                        break;
                    case 3:
                        fieldString += `||:three:||`;
                        break;
                    case 4:
                        fieldString += `||:four:||`;
                        break;
                    case 5:
                        fieldString += `||:five:||`;
                        break;
                    case 6:
                        fieldString += `||:six:||`;
                        break;
                    case 7:
                        fieldString += `||:seven:||`;
                        break;
                    case 8:
                        fieldString += `||:eight:||`;
                        break;
                    default:
                        fieldString += `||:zero:||`;
                        break;
                }
            }
        }

        fieldString += `\n`;
    }

    await global.message.send(`MINEFIELD`, message.channel, fieldString);
}

function randomIntFromInterval(min, max) // min and max included
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}