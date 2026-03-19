// Elemental Hunter — HUD Renderer
// Displays player stats: HP, MAG, Combo count, Cooldowns, Turn indicator

import { _decorator, Node, Sprite, UILabel, Color, ProgressBar } from 'cc';
import { HUD } from './types';
import { PlayerId, ArtifactType } from './types';

const { ccclass } = _decorator;

export class HUD {
  private root: Node;
  private hpBars: Record<PlayerId, Node> = {} as any;
  private magBars: Record<PlayerId, Node> = {} as any;
  private labels: Record<PlayerId, Record<string, UILabel>> = {} as any;
  private artifactIcons: Record<PlayerId, Node> = {} as any;

  // References to Cocos nodes (assigned via editor)
  private p1Container: Node;
  private p2Container: Node;

  constructor(p1Node: Node, p2Node: Node) {
    this.p1Container = p1Node;
    this.p2Container = p2Node;
    this.root = p1Node.parent; // common root
    this.initContainers();
  }

  private initContainers(): void {
    this.hpBars[PlayerId.P1] = this.p1Container.getChildByName('hp_bar');
    this.hpBars[PlayerId.P2] = this.p2Container.getChildByName('hp_bar');
    this.magBars[PlayerId.P1] = this.p1Container.getChildByName('mag_bar');
    this.magBars[PlayerId.P2] = this.p2Container.getChildByName('mag_bar');

    // Labels
    (Object.values(PlayerId) as PlayerId[]).forEach(pid => {
      const container = pid === PlayerId.P1 ? this.p1Container : this.p2Container;
      this.labels[pid] = {
        combo: container.getChildByName('lbl_combo')?.getComponent(UILabel) || null,
        turn: container.getChildByName('lbl_turn')?.getComponent(UILabel) || null,
        affinity: container.getChildByName('lbl_affinity')?.getComponent(UILabel) || null,
        cooldown: container.getChildByName('lbl_cooldown')?.getComponent(UILabel) || null
      };
      this.artifactIcons[pid] = container.getChildByName('artifact_container');
    });
  }

  updateAll(players: Record<PlayerId, any>): void {
    (Object.values(PlayerId) as PlayerId[]).forEach(pid => {
      this.updateHP(pid, players[pid].hp, players[pid].hp); // max not stored separately; assume fixed
      this.updateMAG(pid, players[pid].mag, players[pid].magCap);
      this.labels[pid].combo?.set(`Combo: ${players[pid].comboCount}`);
      this.labels[pid].affinity?.set(players[pid].elementAffinity);
    });
  }

  updateHP(playerId: PlayerId, current: number, max: number): void {
    const barNode = this.hpBars[playerId];
    if (!barNode) return;
    const prog = barNode.getComponent(ProgressBar);
    if (prog) {
      prog.progress = current / max;
      // Change color if low HP
      const spr = barNode.getComponent(Sprite);
      if (spr) {
        spr.color = current < max * 0.3 ? Color.RED : Color.GREEN;
      }
    }
  }

  updateMAG(playerId: PlayerId, current: number, max: number): void {
    const barNode = this.magBars[playerId];
    if (!barNode) return;
    const prog = barNode.getComponent(ProgressBar);
    if (prog) {
      prog.progress = max > 0 ? current / max : 0;
    }
  }

  updateComboCount(playerId: PlayerId, count: number): void {
    this.labels[playerId].combo?.set(`Combo: ${count}`);
    // Flash effect?
  }

  updateConsecutiveRolls(playerId: PlayerId, count: number): void {
    this.labels[playerId].cooldown?.set(`Rolls: ${count}/3`);
  }

  updateTurn(currentTurn: PlayerId, round: number): void {
    (Object.values(PlayerId) as PlayerId[]).forEach(pid => {
      const isActive = pid === currentTurn;
      this.labels[pid].turn?.set(isActive ? `● Turn (R${round})` : `R${round}`);
      this.labels[pid].turn.node.color = isActive ? Color.YELLOW : Color.GRAY;
    });
  }

  showATKBuff(playerId: PlayerId): void {
    // Show "+ATK" floating text near HUD
    const container = playerId === PlayerId.P1 ? this.p1Container : this.p2Container;
    this.showFloatingText(container, '+ATK', Color.ORANGE);
  }

  showMAGBuff(playerId: PlayerId): void {
    const container = playerId === PlayerId.P1 ? this.p1Container : this.p2Container;
    this.showFloatingText(container, '+MAG', Color.CYAN);
  }

  damagePlayer(playerId: PlayerId, damage: number): void {
    const container = playerId === PlayerId.P1 ? this.p1Container : this.p2Container;
    this.showFloatingText(container, `-${damage}`, Color.RED);
    // Shake effect?
  }

  updateArtifactUsed(playerId: PlayerId, artifact: ArtifactType): void {
    const iconContainer = this.artifactIcons[playerId];
    if (!iconContainer) return;
    // Add or highlight artifact icon
    const iconNode = new Node(`artifact_${artifact}`);
    const spr = iconNode.addComponent(Sprite);
    spr.color = Color.WHITE;
    // Set icon sprite based on artifact type
    iconNode.setPosition(this.artifactIcons[playerId].children.length * 30, 0, 0);
    iconContainer.addChild(iconNode);
  }

  showGameOver(winner: PlayerId, reason: string, finalHp: Record<PlayerId, number>): void {
    // Show modal or large overlay with result
    // Implementation depends on UI structure
    logger.log('[HUD] Game Over:', winner, reason, finalHp);
  }

  private showFloatingText(parent: Node, text: string, color: Color): void {
    const node = new Node('floating');
    const lbl = node.addComponent(UILabel);
    lbl.string = text;
    lbl.fontSize = 24;
    lbl.color = color;
    parent.addChild(node);
    node.setPosition(0, 0, 0);

    tween(node)
      .to(1.0, { position: new Vec3(0, 100, 0) })
      .call(() => node.destroy())
      .start();
  }

  highlightSelection(playerId: PlayerId, tokenId: string): void {
    // Could highlight token in HUD (not implemented)
  }

  refresh(players: Record<PlayerId, any>): void {
    this.updateAll(players);
  }
}
