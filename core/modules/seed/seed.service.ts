import {
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { EnvironmentsEnum, ProvidersEnum, RolesCodesEnum } from '../../common/enums';
import { ISeedBusinessData } from './dto/seed-business.input';
import { ISeedProductData, ISeedCatalogData } from './seed.types';
import { CatalogsService } from '../catalogs/catalogs.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateBusinessInput } from '../businesses/dto/create-business.input';
import { UpdateBusinessInput } from '../businesses/dto/update-business.input';
import { CreateCatalogInput } from '../catalogs/dto/create-catalog.input';
import { ProductsService } from '../products/products.service';
import { CreateProductInput } from '../products/dto/create-product.input';
import { ProductImageInput } from '../products/dto/product-image.input';
import { ProductVariationInput } from '../products/dto/product-variation.input';

/** Default currency ID for USD in seed data. */
const USD_CURRENCY_ID = 1;

/**
 * Service for seeding development data.
 * All methods only run when NODE_ENV = 'development'.
 */
@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        private readonly businessesService: BusinessesService,
        private readonly catalogsService: CatalogsService,
        private readonly productsService: ProductsService,
    ) {}

    /**
     * Verifies that the environment is development.
     */
    private assertDevelopment(): void {
        if (process.env.NODE_ENV !== EnvironmentsEnum.Development) {
            throw new ForbiddenException(
                'Seed operations are only allowed in development environment',
            );
        }
    }

    /**
     * Seeds a single business.
     * Skips if email already exists.
     * @param {ISeedBusinessData} item - Business data to seed
     */
    async seedOneBusiness(item: ISeedBusinessData) {
        this.assertDevelopment();
        const businessData: CreateBusinessInput = {
            email: item.email,
            emailValidated: item.emailValidated ?? false,
            name: item.name,
            path: item.path,
            password: 'S3guraP@ssw0rd!',
            role: RolesCodesEnum.BUSINESS
        };
        await this.businessesService.create(businessData, ProvidersEnum.LineUp);
        const business = await this.businessesService.findOneByPath(item.path);
        const businessData2: UpdateBusinessInput = {
            id: business.id,
            email: item.email,
            name: item.name,
            path: item.path,
            description: item.description,
            telephone: item.telephone,
            tags: item.tags,
            imageCode: item.imgCode
        };
        const businessReq = {
            businessId: business.id,
            path: business.path
        };
        await this.businessesService.update(businessData2, businessReq);
    }

    /**
     * Seeds a single catalog.
     * Skips if path already exists.
     * @param {ISeedCatalogData} item - Catalog data to seed
     */
    async seedOneCatalog(item: ISeedCatalogData) {
        this.assertDevelopment();
        const catalogData: CreateCatalogInput = {
            title: item.title,
            path: item.path,
            tags: item.tags,
            imageCode: item.imgCode
        };
        const businessReq = {
            businessId: item.idCreationBusiness,
            path: item.path
        };
        await this.catalogsService.create(catalogData, businessReq);
    }

    /**
     * Seeds a single product.
     * Catalog must exist (seed businesses and catalogs first).
     * @param {ISeedProductData} item - Product data to seed
     */
    async seedOneProduct(item: ISeedProductData): Promise<void> {
        this.assertDevelopment();
        console.log(item.catalogPath);
        const catalog = await this.catalogsService.findOneByPath(item.catalogPath);
        const businessReq = {
            businessId: catalog.idCreationBusiness,
            path: catalog.business?.path ?? catalog.path
        };
        const images = item.images.map((img) => ({
            imageCode: img.imageCode,
            order: img.order
        })) as ProductImageInput[];
        const variations = item.variations?.map((v) => ({
            title: v.title,
            options: v.options
        })) as ProductVariationInput[] | undefined;
        const productData: CreateProductInput = {
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            idCatalog: catalog.id,
            images,
            tags: item.tags,
            variations
        };
        if (item.price != null) {
            productData.price = item.price;
            productData.idCurrency = USD_CURRENCY_ID;
        }
        await this.productsService.create(productData, businessReq);
    }
}
