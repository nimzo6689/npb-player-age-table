import { createApp } from "vue";

function calculateAge(birthday, baseDate) {
  const birthDate = new Date(birthday);
  const today = new Date(baseDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const PASSING_MARK_GAMES = 100;
const PASSING_MARK_GAMES_STARTED = 15;
const PASSING_MARK_GAMES_RELIEF = 40;
const PASSING_MARK_OPS = 0.75;
const PASSING_MARK_ERA = 3.0;

createApp({
  data() {
    return {
      team: "",
      players: [],
    };
  },
  computed: {
    records() {
      let records = [...Array(35)].map((_, i) => ({
        age: i + 16,
        starters: [],
        reliefs: [],
        others: [],
        catchers: [],
        infielders: [],
        outfielders: [],
      }));

      this.players.forEach((p) => {
        let name = p.name.split(" ")[0];
        // 育成選手は () で表記。
        if (p.uniformNo.length >= 3) {
          name = `(${name})`;
        }
        const age = calculateAge(p.dateOfBirth, "2024-04-01");
        const targetRecord = records.find((r) => r.age === age);

        switch (p.position) {
          case "捕手":
            targetRecord.catchers.push({
              name: name,
              isUsed: p.games >= PASSING_MARK_GAMES,
              isUseful: p.games >= PASSING_MARK_GAMES && p.OPS >= PASSING_MARK_OPS,
            });
            break;
          case "内野手":
            targetRecord.infielders.push({
              name: name,
              isUsed: p.games >= PASSING_MARK_GAMES,
              isUseful: p.games >= PASSING_MARK_GAMES && p.OPS >= PASSING_MARK_OPS,
            });
            break;
          case "外野手":
            targetRecord.outfielders.push({
              name: name,
              isUsed: p.games >= PASSING_MARK_GAMES,
              isUseful: p.games >= PASSING_MARK_GAMES && p.OPS >= PASSING_MARK_OPS,
            });
            break;
          case "投手":
          default:
            if (p.gamesStarted >= 10) {
              targetRecord.starters.push({
                name: name,
                isUsed: p.games >= PASSING_MARK_GAMES_STARTED,
                isUseful: p.games >= PASSING_MARK_GAMES_STARTED && p.ERA < PASSING_MARK_ERA,
              });
            } else if (p.games >= 15) {
              targetRecord.reliefs.push({
                name: name,
                isUsed: p.games >= PASSING_MARK_GAMES_RELIEF,
                isUseful: p.games >= PASSING_MARK_GAMES_RELIEF && p.ERA < PASSING_MARK_ERA,
              });
            } else {
              targetRecord.others.push({
                name: name,
                isUsed: false,
                isUseful: false,
              });
            }
        }
      });

      const firstIndex = records.findIndex((r) => {
        const hasAnyPlayer =
          r.starters.length ||
          r.reliefs.length ||
          r.others.length ||
          r.catchers.length ||
          r.infielders.length ||
          r.outfielders.length;
        return hasAnyPlayer || r.age >= 19;
      });
      records = records.slice(firstIndex);

      const lastIndex = records
        .toReversed((a, b) => a.age - b.age)
        .findIndex((r) => {
          const hasAnyPlayer =
            r.starters.length ||
            r.reliefs.length ||
            r.others.length ||
            r.catchers.length ||
            r.infielders.length ||
            r.outfielders.length;
          return hasAnyPlayer || r.age <= 35;
        });
      records = records
        .toReversed((a, b) => a.age - b.age)
        .slice(lastIndex)
        .toReversed((a, b) => a.age - b.age);

      return records;
    },
  },
  methods: {
    async fetchData() {
      const res = await fetch(`http://127.0.0.1:5500/players/${this.team}.json`);
      this.players = await res.json();
    },
  },
  watch: {
    team(newTeam) {
      if (!newTeam) {
        this.players = [];
        return;
      }
      this.fetchData();
    },
  },
}).mount("#app");
