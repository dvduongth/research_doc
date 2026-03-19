// Elemental Hunter — Combo Animation
// Visual effects for C3/C4 combos and goal attacks

import { _decorator, Node, Sprite, UILabel, Color, tween, Vec3, ParticleSystem } from 'cc';
import { ComboAnimation } from './types';
import { ComboType } from './types';

const { ccclass } = _decorator;

export class ComboAnimation {
  private root: Node;
  private particleNode: Node | null = null;

  constructor(rootNode: Node) {
    this.root = rootNode;
  }

  playCombo(comboType: ComboType, playerId: string, onComplete?: () => void): void {
    // Create fullscreen effect or targeted at player HUD
    const text = comboType === 'C3' ? 'C3 — TRIPLE!' : 'C4 — MASTER!';
    const color = comboType === 'C3' ? Color.ORANGE : Color.MAGENTA;

    this.showFloatingText(this.root, text, color, 60);

    // Play particle burst if available
    if (this.particleNode) {
      this.particleNode.active = true;
    }

    // Shake screen lightly
    // this.root.runAction(...)

    const duration = 2.0;
    this.scheduleOnce(() => {
      if (this.particleNode) this.particleNode.active = false;
      onComplete?.();
    }, duration);
  }

  playGoalAttack(damage: number, onComplete?: () => void): void {
    this.showFloatingText(this.root, `-${damage}`, Color.RED, 80);
    this.scheduleOnce(() => onComplete?.(), 1.5);
  }

  private showFloatingText(parent: Node, text: string, color: Color, fontSize: number): void {
    const node = new Node('combo_text');
    const lbl = node.addComponent(UILabel);
    lbl.string = text;
    lbl.fontSize = fontSize;
    lbl.color = color;
    node.setPosition(0, 100, 0);
    parent.addChild(node);

    tween(node)
      .to(2.0, { position: new Vec3(0, 200, 0) }, { easing: 'sineOut' })
      .call(() => node.destroy())
      .start();
  }

  setParticleSystem(ps: ParticleSystem): void {
    const node = new Node('combo_particles');
    node.addComponent(ps);
    this.root.addChild(node);
    this.particleNode = node;
  }
}
