#!/usr/bin/env node
"use strict";

const fs = require("fs");
const cheerio = require("cheerio");

(async () => {
  const teamList = [
    { teamId: 1, kind: "p" },
    { teamId: 1, kind: "b" },
    { teamId: 2, kind: "p" },
    { teamId: 2, kind: "b" },
    { teamId: 3, kind: "p" },
    { teamId: 3, kind: "b" },
    { teamId: 4, kind: "p" },
    { teamId: 4, kind: "b" },
    { teamId: 5, kind: "p" },
    { teamId: 5, kind: "b" },
    { teamId: 6, kind: "p" },
    { teamId: 6, kind: "b" },
    { teamId: 7, kind: "p" },
    { teamId: 7, kind: "b" },
    { teamId: 8, kind: "p" },
    { teamId: 8, kind: "b" },
    { teamId: 9, kind: "p" },
    { teamId: 9, kind: "b" },
    { teamId: 11, kind: "p" },
    { teamId: 11, kind: "b" },
    { teamId: 12, kind: "p" },
    { teamId: 12, kind: "b" },
    { teamId: 376, kind: "p" },
    { teamId: 376, kind: "b" },
  ];

  let playerURLs = [];
  for (const team of teamList) {
    console.log(`${team.teamId}/memberlist?kind=${team.kind}`);
    await new Promise((_) => setTimeout(_, 1000));

    const url = `https://baseball.yahoo.co.jp/npb/teams/${team.teamId}/memberlist?kind=${team.kind}`;
    const response = await fetch(url);

    const $ = cheerio.load(await response.text());

    playerURLs = playerURLs.concat(
      $("#tm_plyr > tr > td > a")
        .map((_, elem) => $(elem).attr("href"))
        .toArray()
    );
  }

  fs.writeFileSync("./json/playerURLs.json", JSON.stringify([...new Set(playerURLs)]));
})();
