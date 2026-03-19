// Elemental Hunter — Dice UI
// Handles dice rolling input, Power Roll mode, and result display

import { _decorator, Node, Sprite, UILabel, Button, Color, Vec3 } from 'cc';
import { DiceUI } from './types';

const { ccclass } = _decorator;

export class DiceUI {
  private root: Node;
  private dice1: Node;
  private dice2: Node;
  private rollButton: Node;
  private powerRollToggle: Node;
  private resultLabel: Node;
  private cooldownLabel: Node;

  // Callbacks
  public onRoll?: (powerRollRange?: [number, number]) => void;
  public onPowerRollToggle?: (enabled: boolean) => void;

  // State
  private isPowerRollEnabled: boolean = false;
  private powerRollRange: [number, number] = [8, 10]; // default range
  private isRolling: boolean = false;

  constructor(rootNode: Node) {
    this.root = rootNode;
    this.dice1 = rootNode.getChildByName('dice1');
    this.dice2 = rootNode.getChildByName('dice2');
    this.rollButton = rootNode.getChildByName('btn_roll');
    this.powerRollToggle = rootNode.getChildByName('btn_power_roll');
    this.resultLabel = rootNode.getChildByName('label_result');
    this.cooldownLabel = rootNode.getChildByName('label_cooldown');

    this.bindButtons();
  }

  private bindButtons(): void {
    const btnRoll = this.rollButton.getComponent(Button);
    if (btnRoll) {
      btnRoll.node.on('click', () => {
        if (this.isRolling) return;
        this.isRolling = true;
        this.onRoll?.(this.isPowerRollEnabled ? this.powerRollRange : undefined);
      });
    }

    const btnPower = this.powerRollToggle.getComponent(Button);
    if (btnPower) {
      btnPower.node.on('click', () => {
        this.isPowerRollEnabled = !this.isPowerRollEnabled;
        this.updatePowerRollUI();
        this.onPowerRollToggle?.(this.isPowerRollEnabled);
      });
    }
  }

  private updatePowerRollUI(): void {
    const btnSpr = this.powerRollToggle.getComponent(Sprite);
    if (btnSpr) {
      btnSpr.color = this.isPowerRollEnabled ? new Color(100, 255, 100) : new Color(200, 200, 200);
    }
    // Could also show current range
  }

  showResult(values: [number, number], isDouble: boolean, doubleCooldown: number): void {
    // Update dice sprites to show numbers (placeholder: set color intensity)
    this.setDiceValue(this.dice1, values[0]);
    this.setDiceValue(this.dice2, values[1]);

    // Show sum and double status
    const sum = values[0] + values[1];
    const lbl = this.resultLabel?.getComponent(UILabel);
    if (lbl) {
      lbl.string = `Tổng: ${sum}${isDouble ? ' (Đôi!)' : ''}`;
    }

    // Cooldown indicator
    const cdLbl = this.cooldownLabel?.getComponent(UILabel);
    if (cdLbl) {
      cdLbl.string = `Double CD: ${doubleCooldown}`;
    }

    // Enable rolling again after delay (server confirms turn processed)
    this.isRolling = false;
  }

  private setDiceValue(diceNode: Node, value: number): void {
    const spr = diceNode.getComponent(Sprite);
    if (spr) {
      // Change color based on value (1-6) as placeholder
      const hue = (value - 1) * 30; // 0-150 degrees
      spr.color = Color.fromHSV(hue, 0.8, 0.9);
    }
    const lblNode = diceNode.getChildByName('value_label');
    if (lblNode) {
      const lbl = lblNode.getComponent(UILabel);
      if (lbl) lbl.string = value.toString();
    }
  }

  setEnabled(enabled: boolean): void {
    const btnRoll = this.rollButton.getComponent(Button);
    if (btnRoll) {
      btnRoll.interactable = enabled;
    }
    const btnPower = this.powerRollToggle.getComponent(Button);
    if (btnPower) {
      btnPower.interactable = enabled;
    }
  }

  reset(): void {
    this.isRolling = false;
    this.setDiceValue(this.dice1, 0);
    this.setDiceValue(this.dice2, 0);
    this.resultLabel?.getComponent(UILabel)?.set(''); // clear
    this.cooldownLabel?.getComponent(UILabel)?.set('');
  }

  setPowerRollRange(min: number, max: number): void {
    this.powerRollRange = [min, max];
  }
}
