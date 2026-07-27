import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPlayerTierModel } from "../tiers.js";

const fixtureUrl = new URL("./fixtures/sample-analysis.json", import.meta.url);

test("tier model assigns scores and sorts descending", async () => {
  const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
  const tiers = buildPlayerTierModel(fixture.players);
  assert.equal(tiers.length, 3);
  assert.ok(tiers.every((player) => player.analysisTier));
  assert.ok(tiers.every((player) => Number.isFinite(player.tierComposite)));
  for (let index = 1; index < tiers.length; index += 1) {
    assert.ok(tiers[index - 1].tierComposite >= tiers[index].tierComposite);
  }
});

test("tier model excludes inactive players without signals", () => {
  const tiers = buildPlayerTierModel([{
    sleeperId:"inactive",name:"Inactive",position:"WR",status:"inactive",
    expectedPpg:0,projectedTotal:0,dynastyValue:0,
  }]);
  assert.deepEqual(tiers, []);
});
