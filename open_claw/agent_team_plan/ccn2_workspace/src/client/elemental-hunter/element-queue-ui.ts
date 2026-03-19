// Elemental Hunter — Element Queue UI
// Displays player's current element queue with icons and combo highlighting

import { _decorator, Node, Sprite, UILabel, Color, Vec3 } from 'cc';
import { ElementQueueUI } from './types';
import { ElementType } from './types';

const { ccclass } = _decorator;

export class ElementQueueUI {
  private root: Node;
  private queueContainer: Node;
  private icons: Map<number, Node> = new Map(); // index -> node
  private elementSprites: Map<string, Sprite> = new Map(); // cache element icons

  // Colors for elements
  private elementColors: Record<ElementType, Color> = {
    [ElementType.Fire]: new Color(255, 100, 50),
    [ElementType.Ice]: new Color(100, 200, 255),
    [ElementType.Grass]: new Color(100, 255, 100),
    [ElementType.Rock]: new Color(150, 150, 150)
  };

  constructor(attachTo: Node) {
    this.root = attachTo;
    this.queueContainer = this.root.getChildByName('queue_container') || this.root; // fallback
  }

  updateQueue(playerId: string, queue: ElementType[]): void {
    this.clear();

    queue.forEach((element, index) => {
      const node = this.createQueueIcon(element, index);
      this.queueContainer.addChild(node);
      this.icons.set(index, node);
    });
  }

  highlightCombo(comboType: string, indices: number[]): void {
    indices.forEach(idx => {
      const node = this.icons.get(idx);
      if (node) {
        const spr = node.getComponent(Sprite);
        if (spr) {
          spr.color = Color.YELLOW;
          // Pulse animation
          // tween(spr.node).to(0.3, {scale: 1.2}).to(0.3, {scale: 1.0}).union().repeat(2).start();
        }
      }
    });
  }

  clear(): void {
    this.icons.forEach(node => node.destroy());
    this.icons.clear();
  }

  private createQueueIcon(element: ElementType, index: number): Node {
    const node = new Node(`queue_${index}`);
    const sprite = node.addComponent(Sprite);
    sprite.color = this.elementColors[element];

    // Size: 40x40? Set via UITransform
    const transform = node.getComponent('UITransform') as any;
    if (transform) {
      transform.setContentSize(40, 40);
    }

    // Position: horizontal layout
    const spacing = 50;
    node.setPosition(index * spacing - ((this.icons.size + 1) * spacing) / 2, 0, 0);

    // Optional: add small label showing element initial
    // labelNode = new Node('label'); etc.

    return node;
  }
}
