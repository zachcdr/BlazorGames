import type { TemplateModule } from '../../engine/types';
import { definition, type Params } from './definition';
import { Renderer } from './Renderer';

export const traceShape: TemplateModule<Params> = { ...definition, Renderer };
