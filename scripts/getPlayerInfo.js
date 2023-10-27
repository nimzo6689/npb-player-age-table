#!/usr/bin/env node
"use strict";

const fs = require("fs");
const cheerio = require("cheerio");

class Utils {
  static getDateOfBirth(origDateOfBirth) {
    const datePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
    const dp = origDateOfBirth.match(datePattern);
    return dp[1] + "-" + dp[2].padStart(2, "0") + "-" + dp[3].padStart(2, "0");
  }

  static getThrowsAndBats(throwsAndBats) {
    const tbPattern = /(.)投げ(.)打ち/;
    const tbParts = throwsAndBats.match(tbPattern);
    return [tbParts[1], tbParts[2]];
  }

  static toNullIfHyphen(value) {
    return value === "-" ? null : value;
  }
}

const teams = [
  { id: "tigers", name: "阪神タイガース", players: [] },
  { id: "carp", name: "広島東洋カープ", players: [] },
  { id: "baystars", name: "横浜DeNAベイスターズ", players: [] },
  { id: "giants", name: "読売ジャイアンツ", players: [] },
  { id: "swallows", name: "東京ヤクルトスワローズ", players: [] },
  { id: "dragons", name: "中日ドラゴンズ", players: [] },
  { id: "buffaloes", name: "オリックス・バファローズ", players: [] },
  { id: "marines", name: "千葉ロッテマリーンズ", players: [] },
  { id: "hawks", name: "福岡ソフトバンクホークス", players: [] },
  { id: "eagles", name: "東北楽天ゴールデンイーグルス", players: [] },
  { id: "lions", name: "埼玉西武ライオンズ", players: [] },
  { id: "fighters", name: "北海道日本ハムファイターズ", players: [] },
];

(async () => {
  const playerURLs = JSON.parse(fs.readFileSync("./json/playerURLs.json"));

  let currentTeam = "";

  for (const playerURL of playerURLs) {
    await new Promise((_) => setTimeout(_, 100));

    let response;
    for (let i = 0; i < 5; i++) {
      response = await fetch(`https://baseball.yahoo.co.jp${playerURL}`);
      if (response.status === 200) {
        break;
      }
    }
    if (response.status !== 200) {
      process.exit(1);
    }

    const $ = cheerio.load(await response.text());

    const team = $("header > h2").first().text();
    const name = $("ruby > h1").text();
    const uniformNo = $("p.bb-profile__number").text();
    const dateOfBirth = Utils.getDateOfBirth($("div.bb-profile__data dd").eq(1).text());
    const [throws, bats] = Utils.getThrowsAndBats($("div.bb-profile__data dd").eq(5).text());
    const position = $("p.bb-profile__position").text();

    let games = "",
      gamesStarted = null,
      ERA = null,
      OPS = null;

    const FIRST_ROW_PREFIX = "#js-tabDom01 > section:nth-child(1) > table tr:nth-child(2)"
    const SECOND_ROW_PREFIX = "#js-tabDom01 > section:nth-child(1) > table tr:nth-child(4)"
    if (position === "投手") {
      games = $(`${FIRST_ROW_PREFIX} > td:nth-child(2)`).text();
      gamesStarted = $(`${FIRST_ROW_PREFIX} > td:nth-child(3)`).text();
      ERA = $(`${FIRST_ROW_PREFIX} > td:nth-child(1)`).text();
    } else {
      games = $(`${FIRST_ROW_PREFIX} > td:nth-child(2)`).text();
      OPS = $(`${SECOND_ROW_PREFIX} > td:nth-child(10)`).text();
    }

    teams
      .find((t) => t.name === team)
      .players.push({
        name: name,
        uniformNo: uniformNo,
        dateOfBirth: dateOfBirth,
        throws: throws,
        bats: bats,
        position: position,
        games: Utils.toNullIfHyphen(games),
        gamesStarted: Utils.toNullIfHyphen(gamesStarted),
        ERA: Utils.toNullIfHyphen(ERA),
        OPS: Utils.toNullIfHyphen(OPS),
      });

    if (currentTeam !== team) {
      console.log(`${team} is being fetched.`);
      currentTeam = team;
    }
  }

  teams.forEach((t) => fs.writeFileSync(`../frontend/players/${t.id}.json`, JSON.stringify(t.players)));
})();
