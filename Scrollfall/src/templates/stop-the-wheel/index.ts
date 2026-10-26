import type { TemplateModule } from '../../engine/types';
import { definition, type Params } from './definition';
import { Renderer } from './Renderer';

export const stopTheWheel: TemplateModule<Params> = { ...definition, Renderer };
