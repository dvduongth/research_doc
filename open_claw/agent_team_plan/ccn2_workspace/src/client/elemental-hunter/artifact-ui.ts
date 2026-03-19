// Elemental Hunter — Artifact UI (Modal)
// Popup for selecting an artifact when landing on Empty Tile

import { _decorator, Node, Sprite, UILabel, Button, Color, Vec3 } from 'cc';
import { ArtifactUI } from './types';
import { ArtifactType } from './types';

const { ccclass } = _decorator;

export class ArtifactUI {
  private root: Node;
  private container: Node;
  private options: Map<ArtifactType, Node> = new Map();

  public onSelect?: (artifact: ArtifactType, params?: any) => void;

  constructor(rootNode: Node) {
    this.root = rootNode;
    this.container = this.root.getChildByName('artifact_container');
    this.hide();
  }

  show(availableArtifacts: ArtifactType[]): void {
    this.clear();
    this.root.active = true;

    // Create button for each available artifact
    availableArtifacts.forEach((artifact, idx) => {
      const btn = this.createArtifactButton(artifact, idx);
      this.container?.addChild(btn);
      this.options.set(artifact, btn);
    });
  }

  hide(): void {
    this.root.active = false;
  }

  private createArtifactButton(artifact: ArtifactType, index: number): Node {
    const btn = new Node(`btn_artifact_${artifact}`);
    const spr = btn.addComponent(Sprite);
    spr.color = Color.WHITE;

    // Label with artifact name
    const lblNode = new Node('label');
    const lbl = lblNode.addComponent(UILabel);
    lbl.string = artifact;
    lbl.fontSize = 18;
    lbl.color = Color.BLACK;
    lblNode.setPosition(0, 0, 0);
    btn.addChild(lblNode);

    // Layout: horizontal row
    const spacing = 120;
    btn.setPosition(index * spacing - ((this.options.size + 1) * spacing) / 2, 0, 0);

    // Button interaction
    const btnComp = btn.addComponent(Button);
    btnComp.transition = Button.Transition.COLOR;
    btnComp.normalColor = new Color(200, 200, 200);
    btnComp.hoverColor = new Color(255, 255, 200);
    btnComp.pressedColor = new Color(150, 150, 150);
    btnComp.clickColor = new Color(100, 100, 100);

    btnComp.node.on('click', () => {
      this.onSelect?.(artifact);
    });

    return btn;
  }

  private clear(): void {
    this.options.forEach(node => node.destroy());
    this.options.clear();
  }
}
