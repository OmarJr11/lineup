import {
  getGradDifferenceByKm,
  getAddressComponentByType,
  convertCoordinateToString,
  getCoordinateFromObject,
  getCoordinateFromDatabaseField,
} from './pyn-pon-coordinates.lib';
import type { IAddressComponent } from '../interfaces';

describe('pyn-pon-coordinates.lib', () => {
  describe('getGradDifferenceByKm', () => {
    it('calculates degree difference from kilometers', () => {
      const diff1 = getGradDifferenceByKm(10);
      const diff2 = getGradDifferenceByKm(20);
      expect(diff1).toBeGreaterThan(0);
      expect(diff2).toBeGreaterThan(diff1);
    });
  });

  describe('getAddressComponentByType', () => {
    it('finds address component matching type', () => {
      const components: IAddressComponent[] = [
        {
          long_name: 'Caracas',
          short_name: 'CCS',
          types: ['locality', 'political'],
        },
        {
          long_name: 'Miranda',
          short_name: 'MIR',
          types: ['administrative_area_level_1'],
        },
      ];
      expect(getAddressComponentByType(components, 'locality'))?.toEqual(
        components[0],
      );
      expect(
        getAddressComponentByType(components, 'administrative_area_level_1'),
      )?.toEqual(components[1]);
      expect(
        getAddressComponentByType(components, 'non_existent'),
      ).toBeUndefined();
    });
  });

  describe('convertCoordinateToString', () => {
    it('converts coordinate object to lat,lng string', () => {
      expect(
        convertCoordinateToString({ latitude: 10.4806, longitude: -66.9036 }),
      ).toBe('10.4806,-66.9036');
    });

    it('returns null for falsy or invalid coordinate input', () => {
      expect(convertCoordinateToString(null as any)).toBeNull();
      expect(convertCoordinateToString({} as any)).toBeNull();
      expect(convertCoordinateToString({ latitude: 10 } as any)).toBeNull();
    });
  });

  describe('getCoordinateFromObject', () => {
    it('extracts valid coordinates from an object', () => {
      const result = getCoordinateFromObject({
        latitude: '10.5',
        longitude: '-66.9',
      });
      expect(result).toEqual({ latitude: 10.5, longitude: -66.9 });
    });

    it('returns null if latitude or longitude is invalid', () => {
      expect(
        getCoordinateFromObject({ latitude: 'abc', longitude: '-66.9' }),
      ).toBeNull();
      expect(
        getCoordinateFromObject({ latitude: '10.5', longitude: 'xyz' }),
      ).toBeNull();
    });
  });

  describe('getCoordinateFromDatabaseField', () => {
    it('parses valid comma-separated string', () => {
      const result = getCoordinateFromDatabaseField('10.4806,-66.9036');
      expect(result).toEqual({ latitude: 10.4806, longitude: -66.9036 });
    });

    it('returns null for malformed string', () => {
      expect(getCoordinateFromDatabaseField('invalid')).toBeNull();
      expect(
        getCoordinateFromDatabaseField('10.4806,-66.9036,extra'),
      ).toBeNull();
      expect(getCoordinateFromDatabaseField('abc,def')).toBeNull();
    });

    it('parses object with x and y fields', () => {
      const result = getCoordinateFromDatabaseField({ x: 10.48, y: -66.9 });
      expect(result).toEqual({ latitude: 10.48, longitude: -66.9 });
    });

    it('parses object with latitude and longitude fields when x/y absent', () => {
      const result = getCoordinateFromDatabaseField({
        latitude: 10.48,
        longitude: -66.9,
      });
      expect(result).toEqual({ latitude: 10.48, longitude: -66.9 });
    });

    it('returns null fields when object contains non-numeric coordinates', () => {
      const result = getCoordinateFromDatabaseField({
        x: 'abc',
        y: 'def',
      } as any);
      expect(result).toEqual({ latitude: null, longitude: null });
    });
  });
});
