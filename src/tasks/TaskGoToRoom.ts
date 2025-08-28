import { Task } from './Task';
import { Logger } from '../utils/Logger';

export class TaskGoToRoom extends Task {
    public targetRoomName: string;

    constructor(targetRoomName: string, priority: number = 3) {
        super('goToRoom', null, priority);
        this.targetRoomName = targetRoomName;
        this.data['targetRoomName'] = targetRoomName; // Store for serialization
    }

    public isValidTask(): boolean {
        // Task is valid if target room is available and different from current room
        const roomStatus = Game.map.getRoomStatus(this.targetRoomName);
        return roomStatus.status === 'normal';
    }

    public isValidTarget(): boolean {
        // Always valid - we're targeting a room name, not a game object
        return true;
    }

    public work(creep: Creep): boolean {
        // If we're already in the target room, task is complete
        if (creep.room.name === this.targetRoomName) {
            return false; // Task complete
        }

        // Find exit to target room
        const exitDir = creep.room.findExitTo(this.targetRoomName);
        if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
            Logger.warn(`TaskGoToRoom: No path from ${creep.room.name} to ${this.targetRoomName}`);
            return false; // Task failed
        }

        // Move to exit
        const exit = creep.pos.findClosestByPath(exitDir);
        if (exit) {
            creep.moveTo(exit, { visualizePathStyle: { stroke: '#00ff00' } });
            return true; // Continue task
        }

        return false; // Task failed
    }

    public override finish(): void {
        Logger.info(`TaskGoToRoom: Reached ${this.targetRoomName}`);
    }

    // Static factory method
    public static create(targetRoomName: string, priority: number = 3): TaskGoToRoom {
        return new TaskGoToRoom(targetRoomName, priority);
    }
}
