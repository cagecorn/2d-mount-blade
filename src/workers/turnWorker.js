importScripts('../managers/turnManager.js');

let manager = null;

onmessage = (e) => {
  const { type } = e.data;
  if (type === 'init') {
    manager = new TurnManager();
  } else if (type === 'step' && manager) {
    manager.update([], {});
    postMessage({ turn: manager.turnCount });
  }
};
