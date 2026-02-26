import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { LogError } from '../../common/helpers/logger.helper';
import { mailResponses } from '../../common/responses';

/**
 * Absolute path to the templates directory.
 * Uses process.cwd() instead of __dirname so the path resolves correctly
 * both in source (ts-node) and in compiled output (dist/), since .hbs files
 * are not copied to dist by the TypeScript compiler.
 */
const TEMPLATES_DIR = join(process.cwd(), 'core', 'modules', 'mail', 'templates');

/**
 * Service responsible for rendering Handlebars email templates.
 * Templates must be placed in `core/modules/mail/templates/` with a `.hbs` extension.
 */
@Injectable()
export class MailTemplatesService {
  private readonly logger = new Logger(MailTemplatesService.name);
  private readonly rTemplate = mailResponses.renderTemplate;

  /**
   * Renders a Handlebars template file with the provided context data.
   *
   * @param {string} templateName - Template filename without extension (e.g. `'welcome'`)
   * @param {Record<string, unknown>} context - Variables injected into the template
   * @returns {string} Rendered HTML string
   * @throws {NotFoundException} When the template file does not exist
   * @throws {InternalServerErrorException} When Handlebars fails to compile or render
   */
  renderTemplate(templateName: string, context: Record<string, unknown>): string {
    const templatePath = this.resolveTemplatePath(templateName);
    const source = this.readTemplateSource(templatePath, templateName);
    return this.compileAndRender(source, context, templateName);
  }

  /**
   * Builds the absolute file path for a given template name.
   *
   * @param {string} templateName - Template name without extension
   * @returns {string} Absolute path to the `.hbs` file
   */
  private resolveTemplatePath(templateName: string): string {
    return join(TEMPLATES_DIR, `${templateName}.hbs`);
  }

  /**
   * Reads the raw source of a template file from disk.
   *
   * @param {string} templatePath - Absolute path to the template file
   * @param {string} templateName - Template name (used for error messages)
   * @returns {string} Raw Handlebars template source
   * @throws {NotFoundException} When the file does not exist at the given path
   */
  private readTemplateSource(templatePath: string, templateName: string): string {
    if (!existsSync(templatePath)) {
      LogError(this.logger, `Template not found: ${templateName}`, this.renderTemplate.name);
      throw new NotFoundException(this.rTemplate.templateNotFound);
    }
    return readFileSync(templatePath, 'utf-8');
  }

  /**
   * Compiles a Handlebars source string and renders it with the given context.
   *
   * @param {string} source - Raw Handlebars template source
   * @param {Record<string, unknown>} context - Data to inject into the template
   * @param {string} templateName - Template name (used for error messages)
   * @returns {string} Rendered HTML string
   * @throws {InternalServerErrorException} When compilation or rendering fails
   */
  private compileAndRender(
    source: string,
    context: Record<string, unknown>,
    templateName: string,
  ): string {
    try {
      const compiled = Handlebars.compile(source);
      return compiled(context);
    } catch (error) {
      LogError(this.logger, error, `${this.renderTemplate.name}:${templateName}`);
      throw new InternalServerErrorException(this.rTemplate.renderError);
    }
  }
}
