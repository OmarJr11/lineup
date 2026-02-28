import { registerEnumType } from "@nestjs/graphql";

export enum ActionsEnum {
    Increment = 'increment',
    Decrement = 'decrement',
}

registerEnumType(ActionsEnum, {
    name: 'ActionsEnum',
    description: 'Actions enum',
});