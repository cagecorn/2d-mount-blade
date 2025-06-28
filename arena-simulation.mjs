import { EventManager } from './src/managers/eventManager.js';
import { CharacterFactory } from './src/factory.js';
import { MicroEngine } from './src/micro/MicroEngine.js';
import { JOBS } from './src/data/jobs.js';
import { promises as fs } from 'fs';

// 양자 요동을 표현하기 위한 간단한 난수 가중치 함수
function quantumFluctuate(value, enable) {
  if (!enable) return value;
  const factor = 1 + (Math.random() - 0.5) * 0.2; // ±10% 변동
  return Math.max(0, value * factor);
}

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

async function simulate({ quantum = false } = {}) {
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
  const powerA = teamA.reduce((sum,u)=>sum + quantumFluctuate(u.attackPower||0, quantum),0);
  const powerB = teamB.reduce((sum,u)=>sum + quantumFluctuate(u.attackPower||0, quantum),0);
  result = {
    winner: powerA >= powerB ? 'A' : 'B',
    teamA_alive: powerA >= powerB ? Math.ceil(Math.random()*6) : 0,
    teamB_alive: powerA >= powerB ? 0 : Math.ceil(Math.random()*6),
    powerA,
    powerB,
    teamA_jobs: teamA.map(u => u.jobId),
    teamB_jobs: teamB.map(u => u.jobId)
  };

  return result;
}

export async function runSimulations(count = 1, { quantum = false } = {}) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const r = await simulate({ quantum });
    results.push(r);
  }
  await fs.writeFile(
    'result.json',
    JSON.stringify(count === 1 ? results[0] : results, null, 2)
  );
  results.forEach((r, i) => console.log(`Run ${i + 1} winner:`, r.winner));
  return results;
}

if (import.meta.main) {
  const countArg = process.argv.find(a => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1]) : 1;
  const quantum = process.argv.includes('--quantum');
  await runSimulations(count, { quantum });
}

