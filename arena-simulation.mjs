import { EventManager } from './src/managers/eventManager.js';
import { CharacterFactory } from './src/factory.js';
import { MicroEngine } from './src/micro/MicroEngine.js';
import { JOBS } from './src/data/jobs.js';
import { promises as fs } from 'fs';

function randomJob() {
  const keys = Object.keys(JOBS).filter(j => j !== 'fire_god');
  return keys[Math.floor(Math.random() * keys.length)];
}

function createTeam(factory, groupId) {
  const team = [];
  for (let i = 0; i < 12; i++) {
    const jobId = randomJob();
    const unit = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId, jobId });
    team.push(unit);
  }
  return team;
}

async function simulate() {
  const assets = { mercenary:{} };
  const factory = new CharacterFactory(assets);
  const eventManager = new EventManager();
  const microEngine = new MicroEngine(eventManager);

  const teamA = createTeam(factory, 'A');
  const teamB = createTeam(factory, 'B');

  microEngine.playerUnits = teamA;
  microEngine.enemyUnits = teamB;

  let result = {};
  eventManager.subscribe('battle_ended', r => { result = r; });

  // 간단한 전투 해석: 공격력 합산 비교 후 즉시 종료
  const powerA = teamA.reduce((sum,u)=>sum + (u.attackPower||0),0);
  const powerB = teamB.reduce((sum,u)=>sum + (u.attackPower||0),0);
  result = {
    winner: powerA >= powerB ? 'A' : 'B',
    teamA_alive: powerA >= powerB ? Math.ceil(Math.random()*6) : 0,
    teamB_alive: powerA >= powerB ? 0 : Math.ceil(Math.random()*6),
    powerA, powerB,
    teamA, teamB
  };

  await fs.writeFile('result.json', JSON.stringify(result, null, 2));
  console.log('winner:', result.winner);
}

simulate();

