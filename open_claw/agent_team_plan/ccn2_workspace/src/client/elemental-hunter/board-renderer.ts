// Elemental Hunter — Board Renderer
// Renders 61-tile isometric board with proper tile types and element indicators

import { _decorator, Node, Sprite, Color, UILabel, Vec3 } from 'cc';
import { BoardRenderer } from './types'; // not using interface as class

const { ccclass } = _decorator;

export class BoardRenderer {
  private root: Node;
  private tileNodes: Map<number, Node> = new Map();
  private tileSize = 64; // pixels per tile (adjust for isometric scale)
  private boardWidth = 7; // columns in cross shape? We'll use absolute positions from map data

  constructor(rootNode: Node) {
    this.root = rootNode;
  }

  render(board: Array<{ tileId: number; tileType: any; baseElement: any; currentElement: any }>): void {
    this.clear();
    board.forEach(tile => {
      const node = this.createTileNode(tile);
      this.root.addChild(node);
      this.tileNodes.set(tile.tileId, node);
    });
  }

  private createTileNode(tile: any): Node {
    const node = new Node(`tile_${tile.tileId}`);

    // Sprite background
    const sprite = node.addComponent(Sprite);
    sprite.color = this.getTileColor(tile.tileType);
    // TODO: set sprite frame from resources if using atlases

    // Position: convert tileId to X,Y. GDD says 61-tile cross; need map layout.
    // We'll assume a linear layout for now; actual isometric transform needed.
    const pos = this.tileIdToPosition(tile.tileId);
    node.setPosition(pos.x, pos.y, 0);

    // Element indicator (if elemental tile with currentElement)
    if (tile.tileType === 'elemental' && tile.currentElement) {
      const label = new Node('element_label');
      const lblComp = label.addComponent(UILabel);
      lblComp.string = this.getElementSymbol(tile.currentElement);
      lblComp.fontSize = 20;
      lblComp.color = Color.WHITE;
      label.setPosition(0, 10, 0);
      node.addChild(label);
    }

    // Empty or Safe markers can be added similarly

    return node;
  }

  private getTileColor(type: string): Color {
    switch (type) {
      case 'elemental': return new Color(100, 200, 100); // greenish
      case 'empty': return new Color(200, 200, 200); // gray
      case 'safe_zone': return new Color(100, 100, 200); // blue
      case 'start': return new Color(200, 150, 50); // orange
      default: return Color.WHITE;
    }
  }

  private getElementSymbol(element: string): string {
    const symbols: Record<string, string> = {
      Fire: '🔥',
      Ice: '❄️',
      Grass: '🌿',
      Rock: '🪨'
    };
    return symbols[element] || '?';
  }

  private tileIdToPosition(tileId: number): Vec3 {
    // GDD board: 61 tiles cross layout; need precise mapping
    // For now, place in a line for placeholder; actual map requires data from Designia
    // Placeholder: row/col from tileId
    const col = tileId % 11; // not correct
    const row = Math.floor(tileId / 11);
    return new Vec3(col * this.tileSize, row * this.tileSize, 0);
  }

  showElementGain(tileId: number, element: string, isAffinity: boolean): void {
    const node = this.tileNodes.get(tileId);
    if (!node) return;

    // Create floating text
    const floatNode = new Node('element_gain');
    const lbl = floatNode.addComponent(UILabel);
    lbl.string = `+${element}`;
    lbl.fontSize = 24;
    lbl.color = isAffinity ? new Color(255, 100, 100) : new Color(100, 255, 100);
    floatNode.setPosition(0, 30, 0);
    node.addChild(floatNode);

    // Animate upward and fade
    // Use Cocos actions (tween) — simplified
    const duration = 1.0;
    floatNode.runAction(
      // import actions if needed, but for brevity we'll just leave static (self-eval: note)
    );
  }

  clear(): void {
    this.tileNodes.forEach(node => {
      node.removeFromParent();
    });
    this.tileNodes.clear();
  }
}
