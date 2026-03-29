import { registerEnumType } from '@nestjs/graphql';

/**
 * Represents week days using JavaScript convention.
 * Sunday = 0, Monday = 1, ..., Saturday = 6.
 */
export enum WeekDayEnum {
  SUNDAY = 'Domingo',
  MONDAY = 'Lunes',
  TUESDAY = 'Martes',
  WEDNESDAY = 'Miércoles',
  THURSDAY = 'Jueves',
  FRIDAY = 'Viernes',
  SATURDAY = 'Sábado',
}

registerEnumType(WeekDayEnum, {
  name: 'WeekDayEnum',
  description: 'Días de la semana',
});
