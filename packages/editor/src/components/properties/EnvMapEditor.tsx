import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { EnvmapComponent } from '@etherealengine/engine/src/scene/components/EnvmapComponent'
import { getEntityErrors } from '@etherealengine/engine/src/scene/components/ErrorComponent'
import { EnvMapSourceType, EnvMapTextureType } from '@etherealengine/engine/src/scene/constants/EnvMapEnum'

import ColorInput from '../inputs/ColorInput'
import CompoundNumericInput from '../inputs/CompoundNumericInput'
import FolderInput from '../inputs/FolderInput'
import ImagePreviewInput from '../inputs/ImagePreviewInput'
import InputGroup from '../inputs/InputGroup'
import SelectInput from '../inputs/SelectInput'
import NodeEditor from './NodeEditor'
import { EditorComponentType, updateProperties, updateProperty } from './Util'

/**
 * EnvMapSourceOptions array containing SourceOptions for Envmap
 */
const EnvMapSourceOptions = Object.values(EnvMapSourceType).map((value) => {
  return { label: value, value }
})

/**
 * EnvMapSourceOptions array containing SourceOptions for Envmap
 */
const EnvMapTextureOptions = Object.values(EnvMapTextureType).map((value) => {
  return { label: value, value }
})

/**
 * EnvMapEditor provides the editor view for environment map property customization.
 *
 * @param       props
 * @constructor
 */
export const EnvMapEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()
  const entity = props.entity

  const onChangeCubemapURLSource = useCallback((value) => {
    const directory = value[value.length - 1] === '/' ? value.substring(0, value.length - 1) : value
    if (directory !== envmapComponent.envMapSourceURL) {
      updateProperties(EnvmapComponent, { envMapSourceURL: directory })
    }
  }, [])

  let envmapComponent = useComponent(entity, EnvmapComponent)

  const errors = getEntityErrors(props.entity, EnvmapComponent)

  return (
    <NodeEditor
      {...props}
      component={EnvmapComponent}
      name={t('editor:properties.envmap.name')}
      description={t('editor:properties.envmap.description')}
    >
      <InputGroup name="Envmap Source" label="Envmap Source">
        <SelectInput
          key={props.entity}
          options={EnvMapSourceOptions}
          value={envmapComponent.type.value}
          onChange={updateProperty(EnvmapComponent, 'type')}
        />
      </InputGroup>
      {envmapComponent.type.value === EnvMapSourceType.Color && (
        <InputGroup name="EnvMapColor" label="EnvMap Color">
          <ColorInput
            value={envmapComponent.envMapSourceColor.value}
            onChange={updateProperty(EnvmapComponent, 'envMapSourceColor')}
          />
        </InputGroup>
      )}
      {envmapComponent.type.value === EnvMapSourceType.Texture && (
        <div>
          <InputGroup name="Texture Type" label="Texture Type">
            <SelectInput
              key={props.entity}
              options={EnvMapTextureOptions}
              value={envmapComponent.envMapTextureType.value}
              onChange={updateProperty(EnvmapComponent, 'envMapTextureType')}
            />
          </InputGroup>
          <InputGroup name="Texture URL" label="Texture URL">
            {envmapComponent.envMapTextureType.value === EnvMapTextureType.Cubemap && (
              <FolderInput value={envmapComponent.envMapSourceURL.value} onChange={onChangeCubemapURLSource} />
            )}
            {envmapComponent.envMapTextureType.value === EnvMapTextureType.Equirectangular && (
              <ImagePreviewInput
                value={envmapComponent.envMapSourceURL.value}
                onChange={updateProperty(EnvmapComponent, 'envMapSourceURL')}
              />
            )}
            {errors?.MISSING_FILE && (
              <div style={{ marginTop: 2, color: '#FF8C00' }}>{t('editor:properties.scene.error-url')}</div>
            )}
          </InputGroup>
        </div>
      )}

      {envmapComponent.type.value !== EnvMapSourceType.None && (
        <InputGroup name="EnvMap Intensity" label="EnvMap Intensity">
          <CompoundNumericInput
            min={0}
            max={20}
            value={envmapComponent.envMapIntensity.value}
            onChange={updateProperty(EnvmapComponent, 'envMapIntensity')}
          />
        </InputGroup>
      )}
    </NodeEditor>
  )
}

export default EnvMapEditor
