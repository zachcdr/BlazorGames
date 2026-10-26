import { useMemo, type ComponentType } from 'react';
import { oddOneOut } from '../templates/odd-one-out';
import { stopTheWheel } from '../templates/stop-the-wheel';
import { traceShape } from '../templates/trace-shape';
import { whichIsHeavier } from '../templates/which-is-heavier';
import { tapCount } from '../templates/tap-count';
import { memoryFlash } from '../templates/memory-flash';
import { quickMath } from '../templates/quick-math';
import { sequenceMemory } from '../templates/sequence-memory';
import { holdToFill } from '../templates/hold-to-fill';
import { checked, type CheckedDefinition } from './definitions';
import type { RendererProps, TemplateModule } from './types';

export type RegisteredTemplate = CheckedDefinition & {
  Renderer: ComponentType<RendererProps<unknown>>;
};

function register<P>(m: TemplateModule<P>): RegisteredTemplate {
  function Renderer({ params, timer, onResult }: RendererProps<unknown>) {
    const parsed = useMemo(() => m.schema.parse(params), [params]);
    return <m.Renderer params={parsed} timer={timer} onResult={onResult} />;
  }
  Renderer.displayName = `${m.id}Renderer`;
  return { ...checked(m), Renderer };
}

const TEMPLATES: ReadonlyMap<string, RegisteredTemplate> = new Map(
  [
    register(oddOneOut),
    register(stopTheWheel),
    register(traceShape),
    register(whichIsHeavier),
    register(tapCount),
    register(memoryFlash),
    register(quickMath),
    register(sequenceMemory),
    register(holdToFill),
  ].map((t) => [t.id, t]),
);

export function getTemplate(id: string): RegisteredTemplate | undefined {
  return TEMPLATES.get(id);
}
