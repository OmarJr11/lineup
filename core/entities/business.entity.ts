import { StatusEnum } from '../common/enums/status.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  BusinessRole,
  BusinessFollower,
  BusinessVisit,
  BusinessSearchIndex,
  Catalog,
  CatalogSearchIndex,
  Discount,
  File,
  Location,
  Product,
  ProductFile,
  ProductSearchIndex,
  ProductSku,
  ProductVariation,
  SocialNetworkBusiness,
  Token,
  DiscountProduct,
  EntityAudit,
  Tag,
} from '.';
import { BusinessHour } from './business-hour.entity';
import { ProvidersEnum } from '../common/enums';

@Entity({ name: 'businesses' })
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('character varying', { unique: true, length: 50 })
  email: string;

  @Column('boolean', { name: 'email_validated' })
  emailValidated: boolean;

  @Column({ type: 'enum', enum: ProvidersEnum })
  provider: ProvidersEnum;

  @Column('character varying', { length: 200, select: false })
  password: string;

  @Column('character varying', { length: 30, nullable: true })
  telephone?: string;

  @Column('character varying', { length: 100 })
  name: string;

  @Column('character varying', { length: 255, nullable: true })
  description?: string;

  @Column('character varying', { unique: true, length: 50 })
  path: string;

  @Column({ type: 'varchar', name: 'image_code', length: 50, nullable: true })
  imageCode?: string;

  @ManyToOne(() => File, (files) => files.businessFiles)
  @JoinColumn([{ name: 'image_code', referencedColumnName: 'name' }])
  image?: File;

  @Column({ type: 'varchar', name: 'hex_color', length: 7, nullable: true })
  hexColor?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column('int8', { default: 0 })
  followers: number;

  @Column('int8', { default: 0 })
  visits: number;

  @Column('boolean', { name: 'is_online', default: false })
  isOnline: boolean;

  /**
   * When true, the storefront may show an equivalent price in Venezuelan bolívares (VES).
   */
  @Column('boolean', {
    name: 'is_bs_equivalent_price_enabled',
    default: false,
  })
  isBsEquivalentPriceEnabled: boolean;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
  status: StatusEnum;

  @OneToMany(() => BusinessRole, (role) => role.creationBusiness)
  creationBusinessRoles?: BusinessRole[];

  @OneToMany(() => BusinessRole, (role) => role.business)
  businessRoles?: BusinessRole[];

  @OneToMany(() => Token, (token) => token.business)
  tokens?: Token[];

  @OneToMany(() => Product, (product) => product.business)
  products?: Product[];

  @OneToMany(() => Product, (product) => product.modificationBusiness)
  modifiedProducts?: Product[];

  @OneToMany(() => Catalog, (catalog) => catalog.business)
  catalogs?: Catalog[];

  @OneToMany(() => Catalog, (catalog) => catalog.modificationBusiness)
  modifiedCatalogs?: Catalog[];

  @OneToMany(() => Location, (location) => location.business)
  locations?: Location[];

  @OneToMany(() => Location, (location) => location.modificationBusiness)
  modifiedLocations?: Location[];

  @OneToMany(() => File, (file) => file.creationBusiness)
  files?: File[];

  @OneToMany(
    () => SocialNetworkBusiness,
    (socialNetworkBusiness) => socialNetworkBusiness.business,
  )
  socialNetworkBusinesses?: SocialNetworkBusiness[];

  @OneToMany(
    () => SocialNetworkBusiness,
    (socialNetworkBusiness) => socialNetworkBusiness.modificationBusiness,
  )
  modifiedSocialNetworkBusinesses?: SocialNetworkBusiness[];

  @OneToMany(() => ProductFile, (productFile) => productFile.business)
  productFiles?: ProductFile[];

  @OneToMany(
    () => ProductFile,
    (productFile) => productFile.modificationBusiness,
  )
  modifiedProductFiles?: ProductFile[];

  @OneToMany(
    () => ProductVariation,
    (productVariation) => productVariation.business,
  )
  productVariations?: ProductVariation[];

  @OneToMany(
    () => ProductVariation,
    (productVariation) => productVariation.modificationBusiness,
  )
  modifiedProductVariations?: ProductVariation[];

  @OneToMany(() => ProductSku, (productSku) => productSku.business)
  productSkus?: ProductSku[];

  @OneToMany(() => ProductSku, (productSku) => productSku.modificationBusiness)
  modifiedProductSkus?: ProductSku[];

  @OneToMany(() => BusinessFollower, (follower) => follower.business)
  businessFollowers?: BusinessFollower[];

  @OneToMany(() => BusinessVisit, (visit) => visit.business)
  businessVisits?: BusinessVisit[];

  @OneToMany(
    () => BusinessHour,
    (businessHour: BusinessHour) => businessHour.business,
  )
  businessHours?: BusinessHour[];

  @OneToMany(() => BusinessSearchIndex, (index) => index.business)
  businessSearchIndexes?: BusinessSearchIndex[];

  @OneToMany(() => CatalogSearchIndex, (index) => index.business)
  catalogSearchIndexes?: CatalogSearchIndex[];

  @OneToMany(() => ProductSearchIndex, (index) => index.business)
  productSearchIndexes?: ProductSearchIndex[];

  @OneToMany(() => Discount, (discount) => discount.business)
  discounts?: Discount[];

  @OneToMany(() => Discount, (discount) => discount.modificationBusiness)
  modifiedDiscounts?: Discount[];

  @OneToMany(
    () => DiscountProduct,
    (discountProduct) => discountProduct.creationBusiness,
  )
  creationDiscountProducts?: DiscountProduct[];

  @OneToMany(
    () => DiscountProduct,
    (discountProduct) => discountProduct.modificationBusiness,
  )
  modifiedDiscountProducts?: DiscountProduct[];

  @OneToMany(() => EntityAudit, (entityAudit) => entityAudit.creationBusiness)
  creationEntityAudits?: EntityAudit[];

  @OneToMany(() => Tag, (tag) => tag.creationBusiness)
  businessTags?: Tag[];
}
