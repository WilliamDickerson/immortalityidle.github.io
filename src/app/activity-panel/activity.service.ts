import { Injectable } from '@angular/core';
import { Activity, ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { AttributeType, CharacterAttribute } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];

  activities: Activity[] = this.getActivityList();

  constructor(
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    reincarnationService: ReincarnationService
  ) {
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  meetsRequirements(activity: Activity): boolean {
    const keys: (keyof CharacterAttribute)[] = Object.keys(
      activity.requirements
    ) as (keyof CharacterAttribute)[];
    for (const keyIndex in keys) {
      const key = keys[keyIndex];
      let requirementValue = 0;
      if (activity.requirements[key] != undefined) {
        requirementValue = activity.requirements[key]!;
      }
      if (
        this.characterService.characterState.attributes[key].value <=
        requirementValue
      ) {
        return false;
      }
    }
    return true;
  }

  checkRequirements() {
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      if (!this.meetsRequirements(this.getActivityByType(this.activityLoop[i].activity))) {
        this.activityLoop.splice(i, 1);
      }
    }
  }

  reset() {
    this.activityLoop = [];
  }

  getActivityByType(activityType: ActivityType): Activity {
    for (const activity of this.activities) {
      if (activity.activityType === activityType) {
        return activity;
      }
    }
    throw Error('Could not find activity from type');
  }

  getActivityList(): Activity[] {
    return [
      {
        name: 'Odd Jobs',
        activityType: ActivityType.OddJobs,
        description:
          'Run errands, pull weeds, clean toilet pits, or whatever else you earn a coin doing. Undignified work for a future immortal, but you have to eat to live.',
        consequenceDescription:
          'Increases a random attribute and provides a little money.',
        consequence: () => {
          const keys = Object.keys(
            this.characterService.characterState.attributes
          ) as AttributeType[];
          // randomly choose any of the first five stats
          const key = keys[Math.floor(Math.random() * 5)];
          this.characterService.characterState.increaseAttribute(key, 0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          this.characterService.characterState.money += 1;
        },
        requirements: {},
      },
      {
        name: 'Resting',
        activityType: ActivityType.Resting,
        description:
          'Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
        consequenceDescription: 'Restores stamina and a little health.',
        consequence: () => {
          this.characterService.characterState.status.stamina.value +=
            this.characterService.characterState.status.stamina.max / 2;
          this.characterService.characterState.status.health.value += 2;
          this.characterService.characterState.checkOverage();
        },
        requirements: {},
      },
      {
        name: 'Begging',
        activityType: ActivityType.Begging,
        description:
          'Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.',
        consequenceDescription:
          'Increases charisma and provides a little money.',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'charisma',
            0.1
          );
          this.characterService.characterState.status.stamina.value -= 1;
          this.characterService.characterState.money +=
            this.characterService.characterState.attributes.charisma.value *
            0.1;
          //TODO: figure out diminishing returns for this
        },
        requirements: {
          charisma: 5,
        },
      },
      {
        name: 'Apprentice Blacksmithing',
        activityType: ActivityType.ApprenticeBlacksmithing,
        description:
          "Work for the local blacksmith. You mostly pump the bellows, but at least you're learning a trade.",
        consequenceDescription:
          'Increases strength and toughness and provides a little money.',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'strength',
            0.1
          );
          this.characterService.characterState.increaseAttribute(
            'toughness',
            0.1
          );
          this.characterService.characterState.status.stamina.value -= 25;
          this.characterService.characterState.money +=
            this.characterService.characterState.attributes.strength.value *
            0.1;
          if (Math.random() < 0.01) {
            if (Math.random() < 0.01) {
              this.inventoryService.addItem(
                this.inventoryService.generateWeapon(1, 'metal')
              );
            } else {
              this.inventoryService.addItem(
                this.inventoryService.itemRepo.junk
              );
            }
            this.characterService.characterState.increaseAttribute(
              'metalLore',
              0.01
            );
          }
        },
        requirements: {
          strength: 10,
          toughness: 10,
        },
      },
      {
        name: 'Blacksmithing',
        activityType: ActivityType.Blacksmithing,
        description:
          'Mold metal into useful things. You might even produce something you want to keep now and then.',
        consequenceDescription:
          'Increases strength and toughness and provides a little money.',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'strength',
            0.2
          );
          this.characterService.characterState.increaseAttribute(
            'toughness',
            0.2
          );
          this.characterService.characterState.status.stamina.value -= 25;
          this.characterService.characterState.money +=
            this.characterService.characterState.attributes.strength.value *
            0.3;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute(
              'metalLore',
              0.1
            );
            this.inventoryService.addItem(
              this.inventoryService.generateWeapon(
                1 +
                  Math.floor(
                    Math.log10(
                      this.characterService.characterState.attributes.metalLore
                        .value
                    )
                  ),
                'metal'
              )
            );
          }
        },
        requirements: {
          strength: 100,
          toughness: 100,
          metalLore: 1,
        },
      },
      {
        name: 'Gather Herbs',
        activityType: ActivityType.GatherHerbs,
        description: 'Search the natural world for useful herbs.',
        consequenceDescription: '',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'intelligence',
            0.1
          );
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          this.inventoryService.addItem(this.inventoryService.itemRepo.herb);
          this.inventoryService.addItem(this.inventoryService.itemRepo.herb);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute(
              'plantLore',
              0.1
            );
          }
        },
        requirements: {
          speed: 10,
          intelligence: 10,
        },
      },
      {
        name: 'Chop Wood',
        activityType: ActivityType.ChopWood,
        description: 'Work as a woodcutter, cutting logs in the forest.',
        consequenceDescription: '',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'strength',
            0.1
          );
          this.characterService.characterState.status.stamina.value -= 10;
          this.inventoryService.addItem(this.inventoryService.itemRepo.log);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute(
              'plantLore',
              0.1
            );
          }
        },
        requirements: {
          strength: 10,
        },
      },
      {
        name: 'Woodworking',
        activityType: ActivityType.Woodworking,
        description: 'Carve wood into useful items.',
        consequenceDescription:
          'Increases strength and intelligence and provides a little money.',
        consequence: () => {
          this.characterService.characterState.increaseAttribute(
            'strength',
            0.2
          );
          this.characterService.characterState.increaseAttribute(
            'intelligence',
            0.2
          );
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.money +=
            (this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.intelligence
                .value) *
            0.3;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute(
              'plantLore',
              0.1
            );
            this.inventoryService.addItem(
              this.inventoryService.generateWeapon(
                1 +
                  Math.floor(
                    Math.log10(
                      this.characterService.characterState.attributes.metalLore
                        .value
                    )
                  ),
                'wood'
              )
            );
          }
        },
        requirements: {
          strength: 100,
          intelligence: 100,
          plantLore: 1,
        },
      },
    ];
  }
}
