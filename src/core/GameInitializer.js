import { AssetLoader } from '../assetLoader.js';

export class GameInitializer {
  constructor(context) {
    // context는 Game 인스턴스로, 초기화 완료 후 init()을 호출한다.
    this.context = context;
    this.loader = new AssetLoader();
  }

  start() {
    const l = this.loader;
    l.loadImage('player', 'assets/player.png');
    l.loadImage('monster', 'assets/monster.png');
    // 원래 맵에서 사용하는 기본 타일셋 이미지
    l.loadImage('floor', 'assets/floor.png');
    l.loadImage('wall', 'assets/wall.png');
    l.loadImage('epic_monster', 'assets/epic_monster.png');
    l.loadImage('warrior', 'assets/images/warrior.png');
    l.loadImage('archer', 'assets/images/archer.png');
    l.loadImage('healer', 'assets/images/healer.png');
    l.loadImage('wizard', 'assets/images/wizard.png');
    l.loadImage('summoner', 'assets/images/summoner.png');
    l.loadImage('bard', 'assets/images/bard.png');
    l.loadImage('fire_god', 'assets/images/fire-god.png');
    l.loadImage('mercenary', 'assets/images/warrior.png');
    l.loadImage('obstacle', 'assets/images/wall-tile.png');
    l.loadImage('gold', 'assets/gold.png');
    l.loadImage('potion', 'assets/potion.png');
    l.loadImage('sword', 'assets/images/shortsword.png');
    l.loadWeaponImages();
    l.loadImage('shield', 'assets/images/shield.png');
    l.loadImage('bow', 'assets/images/bow.png');
    l.loadImage('arrow', 'assets/images/arrow.png');
    l.loadImage('leather_armor', 'assets/images/leatherarmor.png');
    l.loadImage('plate-armor', 'assets/images/plate-armor.png');
    l.loadImage('iron-helmet', 'assets/images/iron-helmet.png');
    l.loadImage('iron-gauntlets', 'assets/images/iron-gauntlets.png');
    l.loadImage('iron-boots', 'assets/images/iron-boots.png');
    l.loadImage('violin-bow', 'assets/images/violin-bow.png');
    l.loadImage('skeleton', 'assets/images/skeleton.png');
    l.loadImage('pet-fox', 'assets/images/pet-fox.png');
    l.loadImage('guardian-hymn-effect', 'assets/images/Guardian Hymn-effect.png');
    l.loadImage('courage-hymn-effect', 'assets/images/Courage Hymn-effect.png');
    l.loadImage('fire-ball', 'assets/images/fire-ball.png');
    l.loadImage('ice-ball', 'assets/images/ice-ball-effect.png');
    l.loadImage('strike-effect', 'assets/images/strike-effect.png');
    l.loadImage('healing-effect', 'assets/images/healing-effect.png');
    l.loadImage('purify-effect', 'assets/images/purify-effect.png');
    l.loadImage('corpse', 'assets/images/corpse.png');
    l.loadImage('parasite', 'assets/images/parasite.png');
    l.loadImage('leech', 'assets/images/parasite.png');
    l.loadImage('worm', 'assets/images/parasite.png');
    l.loadImage('world-tile', 'assets/images/world-tile.png');
    l.loadImage('sea-tile', 'assets/images/sea-tile.png');
    l.loadImage('talisman1', 'assets/images/talisman-1.png');
    l.loadImage('talisman2', 'assets/images/talisman-2.png');
    l.loadEmblemImages();
    l.loadVfxImages();

    l.onReady(() => {
      console.log('에셋 로딩 완료, 게임 설정 시작...');
      // 로딩이 끝나면 Game 인스턴스의 init을 호출해 본격적으로 게임을 시작한다.
      this.context.init(this.loader.assets);

      // Ensure the canvas becomes visible once the game is ready
      // battleCanvas 대신 canvas-container를 표시한다.
      const container = document.getElementById('canvas-container');
      if (container) {
          container.style.display = 'block';
      }
    });
  }
}
