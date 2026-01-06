import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialNetworkBusiness } from '../../entities';
import { BasicService } from '../../common/services';
import { Not, Repository } from 'typeorm';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { socialNetworkBusinessesResponses } from '../../common/responses';

@Injectable()
export class SocialNetworkBusinessesGettersService extends BasicService<SocialNetworkBusiness> {
    private logger = new Logger(SocialNetworkBusinessesGettersService.name);
    private readonly rList = socialNetworkBusinessesResponses.list;
    private readonly _relations = ['socialNetwork', 'socialNetwork.image', 'business'];

    constructor(
        @InjectRepository(SocialNetworkBusiness)
        private readonly repo: Repository<SocialNetworkBusiness>,
    ) {
        super(repo);
    }

    /**
     * Check if a social network business exists by business ID and social network ID
     * @param {number} idBusiness - The ID of the business
     * @param {number} idSocialNetwork - The ID of the social network
     * @returns {Promise<boolean>} True if the social network business exists, false otherwise
     */
    async checkIfExistsByIdBusinessAndSocialNetwork(
        idBusiness: number,
        idSocialNetwork: number
    ): Promise<boolean> {
        try {
            const exists = await this.findOneWithOptions({
                where: { 
                    idCreationBusiness: idBusiness,
                    idSocialNetwork,
                    status: Not(StatusEnum.DELETED)
                },
            });
            return !!exists;
        } catch (error) {
            LogError(this.logger, error, this.checkIfExistsByIdBusinessAndSocialNetwork.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get all social network businesses by business ID
     * @param {number} idBusiness - The ID of the business
     * @returns {Promise<SocialNetworkBusiness[]>}
     */
    async findByBusiness(idBusiness: number): Promise<SocialNetworkBusiness[]> {
        try {
            return await this.createQueryBuilder('snb')
                .leftJoinAndSelect('snb.socialNetwork', 'socialNetwork')
                .leftJoinAndSelect('socialNetwork.image', 'image')
                .where('snb.status <> :status', { status: StatusEnum.DELETED })
                .andWhere('snb.idCreationBusiness = :idBusiness', { idBusiness })
                .getMany();
        } catch (error) {
            LogError(this.logger, error, this.findByBusiness.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a social network business by its ID
     * @param {number} id - The ID of the social network business to find
     * @returns {Promise<SocialNetworkBusiness>} The found social network business
     */
    async findOne(id: number): Promise<SocialNetworkBusiness> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }
}
