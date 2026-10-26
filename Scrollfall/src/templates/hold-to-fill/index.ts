import type { TemplateModule } from '../../engine/types';
import { definition, type Params } from './definition';
import { Renderer } from './Renderer';

export const holdToFill: TemplateModule<Params> = { ...definition, Renderer };
