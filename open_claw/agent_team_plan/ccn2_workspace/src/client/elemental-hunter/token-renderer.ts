// Elemental Hunter — Token Renderer
// Renders horse tokens with ATK labels and movement animations

import { _decorator, Node, Sprite, UILabel, tween, Vec3, UITransform } from 'cc';
import { TokenRenderer } from './types';

const { ccclass } = _decorator;

export class TokenRenderer {
  private root: Node;
  private tokenNodes: Map<string, Node> = new Map();
  private tokenSprites: Map<string, Sprite> = new Map();
  private atkLabels: Map<string, UILabel> = new Map();
  private onClick: ((tokenId: string) => void) | null = null;

  // Simple colored placeholders for tokens; in production use proper sprite atlas
  private playerColors: Record<string, Color> = {
    P1: new Color(255, 100, 100),
    P2: new Color(100, 100, 255)
  };

  constructor(container: Node) {
    this.root = container;
  }

  render(tokens: Array<{ tokenId: string; owner: string; tileId: number; atk: number }>, board: any): void {
    this.clear();
    tokens.forEach(token => {
      const node = this.createTokenNode(token);
      this.root.addChild(node);
      this.tokenNodes.set(token.tokenId, node);
      this.tokenSprites.set(token.tokenId, node.getComponent(Sprite)!);
      const lbl = node.getChildByName('atk_label')?.getComponent(UILabel);
      if (lbl) this.atkLabels.set(token.tokenId, lbl);

      // Set initial position from board tile (needs board position mapping)
      // For now, placeholder: use board tileId to position
      const pos = this.tileIdToPosition(token.tileId);
      node.setPosition(pos);
    });
  }

  private createTokenNode(token: any): Node {
    const node = new Node(`token_${token.tokenId}`);
    node.userData = { tokenId: token.tokenId };

    const sprite = node.addComponent(Sprite);
    sprite.color = this.playerColors[token.owner];
    // TODO: set sprite frame

    // ATK label
    const lblNode = new Node('atk_label');
    const lbl = lblNode.addComponent(UILabel);
    lbl.string = `ATK:${token.atk}`;
    lbl.fontSize = 16;
    lbl.color = Color.WHITE;
    lblNode.setPosition(0, -30, 0);
    node.addChild(lblNode);

    // Make interactive
    // node.on('click', ...)

    return node;
  }

  updateTokenPosition(tokenId: string, tileId: number): void {
    const node = this.tokenNodes.get(tokenId);
    if (!node) return;
    const pos = this.tileIdToPosition(tileId);
    node.setPosition(pos);
  }

  animateMovement(tokenId: string, path: number[], onComplete?: () => void): void {
    const node = this.tokenNodes.get(tokenId);
    if (!node || path.length === 0) {
      onComplete?.();
      return;
    }

    const durationPerTile = 0.15; // seconds
    let delay = 0;
    path.forEach((tileId, idx) => {
      const targetPos = this.tileIdToPosition(tileId);
      this.scheduleOnce(() => {
        tween(node)
          .to(durationPerTile, { position: targetPos }, { easing: 'sineOut' })
          .call(() => {
            if (idx === path.length - 1) {
              onComplete?.();
            }
          })
          .start();
      }, delay);
      delay += durationPerTile;
    });
  }

  animateKickPush(tokenId: string, newTileId: number): void {
    const node = this.tokenNodes.get(tokenId);
    if (!node) return;
    const target = this.tileIdToPosition(newTileId);
    tween(node)
      .to(0.5, { position: target }, { easing: 'backOut' })
      .start();
  }

  showKickDamage(attackerId: string, defenderId: string, damage: number): void {
    // Could show floating damage near defender
    const defNode = this.tokenNodes.get(defenderId);
    if (!defNode) return;

    const dmgNode = new Node('kick_damage');
    const lbl = dmgNode.addComponent(UILabel);
    lbl.string = `-${damage}`;
    lbl.fontSize = 24;
    lbl.color = Color.RED;
    dmgNode.setPosition(0, 50, 0);
    defNode.addChild(dmgNode);

    // Animate up and fade
    tween(dmgNode)
      .to(1.0, { position: new Vec3(0, 100, 0) })
      .call(() => dmgNode.destroy())
      .start();
  }

  highlightToken(tokenId: string, highlight: boolean): void {
    const sprite = this.tokenSprites.get(tokenId);
    if (!sprite) return;
    sprite.color = highlight ? Color.YELLOW : this.getPlayerColorForToken(tokenId);
  }

  clearHighlights(): void {
    this.tokenSprites.forEach((sprite, tokenId) => {
      sprite.color = this.getPlayerColorForToken(tokenId);
    });
  }

  setTokenClickHandler(handler: (tokenId: string) => void): void {
    this.onClick = handler;
    // Attach click listeners to token nodes
    this.tokenNodes.forEach(node => {
      const tokenId = node.userData.tokenId as string;
      // node.on('click', () => this.onClick?.(tokenId));
    });
  }

  updateATKLabel(tokenId: string, atk: number): void {
    const lbl = this.atkLabels.get(tokenId);
    if (lbl) {
      lbl.string = `ATK:${atk}`;
    }
  }

  clear(): void {
    this.tokenNodes.forEach(node => node.destroy());
    this.tokenNodes.clear();
    this.tokenSprites.clear();
    this.atkLabels.clear();
  }

  private tileIdToPosition(tileId: number): Vec3 {
    // Placeholder mapping — must match board renderer's layout
    // For now, simple grid. Actual isometric cross needs proper coordinates.
    const spacing = 80;
    const col = tileId % 11;
    const row = Math.floor(tileId / 11);
    return new Vec3(col * spacing - 320, row * spacing - 240, 0);
  }

  private getPlayerColorForToken(tokenId: string): Color {
    const owner = tokenId.startsWith('P1_') ? 'P1' : 'P2';
    return this.playerColors[owner];
  }
}
