import { t } from 'i18next'
import React, { useCallback } from 'react'

import {
  ImageTransformParameters,
  ModelTransformParameters
} from '@etherealengine/engine/src/assets/classes/ModelTransform'
import { State } from '@etherealengine/hyperflux'

import BooleanInput from '../inputs/BooleanInput'
import InputGroup from '../inputs/InputGroup'
import NumericInput from '../inputs/NumericInput'
import NumericInputGroup from '../inputs/NumericInputGroup'
import ParameterInput from '../inputs/ParameterInput'
import SelectInput from '../inputs/SelectInput'
import StringInput from '../inputs/StringInput'
import CollapsibleBlock from '../layout/CollapsibleBlock'
import PaginatedList from '../layout/PaginatedList'

export default function GLTFTransformProperties({
  transformParms,
  onChange
}: {
  transformParms: State<ModelTransformParameters>
  onChange: (transformParms: ModelTransformParameters) => void
}) {
  const onChangeTransformParm = useCallback((scope: State<any>) => {
    return (value: typeof scope.value) => {
      scope.set(value)
      onChange(JSON.parse(JSON.stringify(transformParms.value)))
    }
  }, [])

  const onChangeParameter = useCallback(
    (scope: State<any>, key: string) => (val: any) => {
      scope[key].set(val)
      onChange(JSON.parse(JSON.stringify(transformParms.value)))
    },
    []
  )

  return (
    <CollapsibleBlock label="glTF-Transform">
      <div
        style={{
          margin: '2rem',
          padding: '1rem',
          color: 'var(--textColor)'
        }}
      >
        <InputGroup name="dst" label={t('editor:properties.model.transform.dst')}>
          <StringInput value={transformParms.dst.value} onChange={onChangeTransformParm(transformParms.dst)} />
        </InputGroup>
        <InputGroup name="resource uri" label={t('editor:properties.model.transform.resourceUri')}>
          <StringInput
            value={transformParms.resourceUri.value}
            onChange={onChangeTransformParm(transformParms.resourceUri)}
          />
        </InputGroup>
      </div>
      <hr />
      <div
        style={{
          margin: '2rem',
          padding: '1rem',
          color: 'var(--textColor)'
        }}
      >
        <InputGroup name="Model Format" label={t('editor:properties.model.transform.modelFormat')}>
          <SelectInput
            value={transformParms.modelFormat.value}
            onChange={onChangeTransformParm(transformParms.modelFormat)}
            options={[
              { label: 'glB', value: 'glb' },
              { label: 'glTF', value: 'gltf' }
            ]}
          />
        </InputGroup>
        <InputGroup name="Remove Duplicates" label={t('editor:properties.model.transform.removeDuplicates')}>
          <BooleanInput value={transformParms.dedup.value} onChange={onChangeTransformParm(transformParms.dedup)} />
        </InputGroup>
        <InputGroup name="Prune Unused" label={t('editor:properties.model.transform.pruneUnused')}>
          <BooleanInput value={transformParms.prune.value} onChange={onChangeTransformParm(transformParms.prune)} />
        </InputGroup>
        <InputGroup name="Reorder" label={t('editor:properties.model.transform.reorder')}>
          <BooleanInput value={transformParms.reorder.value} onChange={onChangeTransformParm(transformParms.reorder)} />
        </InputGroup>
        <InputGroup name="Weld Vertices" label={t('editor:properties.model.transform.weldVertices')}>
          <BooleanInput
            value={transformParms.weld.enabled.value}
            onChange={onChangeTransformParm(transformParms.weld.enabled)}
          />
        </InputGroup>
        {transformParms.weld.enabled.value && (
          <>
            <NumericInputGroup
              name="Weld Threshold"
              label={t('editor:properties.model.transform.weldThreshold')}
              value={transformParms.weld.tolerance.value}
              onChange={onChangeTransformParm(transformParms.weld.tolerance)}
              min={0}
              max={1}
            />
          </>
        )}
        <InputGroup name="Resample Animations" label={t('editor:properties.model.transform.resampleAnimations')}>
          <BooleanInput
            value={transformParms.resample.value}
            onChange={onChangeTransformParm(transformParms.resample)}
          />
        </InputGroup>
        <InputGroup name="Use DRACO Compression" label={t('editor:properties.model.transform.useDraco')}>
          <BooleanInput
            value={transformParms.dracoCompression.enabled.value}
            onChange={onChangeTransformParm(transformParms.dracoCompression.enabled)}
          />
        </InputGroup>
        {transformParms.dracoCompression.enabled.value && (
          <>
            <ParameterInput
              entity={`${transformParms}-draco-compression`}
              values={transformParms.dracoCompression.options.value}
              onChange={onChangeParameter.bind({}, transformParms.dracoCompression.options)}
            />
          </>
        )}
        <InputGroup name="Texture Format" label={t('editor:properties.model.transform.textureFormat')}>
          <SelectInput
            value={transformParms.textureFormat.value}
            onChange={onChangeTransformParm(transformParms.textureFormat)}
            options={[
              { label: 'Default', value: 'default' },
              { label: 'JPG', value: 'jpg' },
              { label: 'KTX2', value: 'ktx2' },
              { label: 'PNG', value: 'png' },
              { label: 'WebP', value: 'webp' }
            ]}
          />
        </InputGroup>
        <NumericInputGroup
          name="Max Texture Size"
          label={t('editor:properties.model.transform.maxTextureSize')}
          value={transformParms.maxTextureSize.value}
          onChange={onChangeTransformParm(transformParms.maxTextureSize)}
          max={4096}
          min={64}
        />
        <InputGroup name="Flip Y" label={t('editor:properties.model.transform.flipY')}>
          <BooleanInput value={transformParms.flipY.value} onChange={onChangeTransformParm(transformParms.flipY)} />
        </InputGroup>
        <InputGroup name="Linear" label={t('editor:properties.model.transform.linear')}>
          <BooleanInput value={transformParms.linear.value} onChange={onChangeTransformParm(transformParms.linear)} />
        </InputGroup>
        {transformParms.textureFormat.value === 'ktx2' && (
          <>
            <InputGroup
              name="Texture Compression Type"
              label={t('editor:properties.model.transform.textureCompressionType')}
            >
              <SelectInput
                value={transformParms.textureCompressionType.value}
                onChange={onChangeTransformParm(transformParms.textureCompressionType)}
                options={[
                  { label: 'UASTC', value: 'uastc' },
                  { label: 'ETC1', value: 'etc1' }
                ]}
              />
            </InputGroup>
            <NumericInputGroup
              name="KTX2 Quality"
              label={t('editor:properties.model.transform.ktx2Quality')}
              value={transformParms.textureCompressionQuality.value}
              onChange={onChangeTransformParm(transformParms.textureCompressionQuality)}
              max={255}
              min={1}
              smallStep={1}
              mediumStep={1}
              largeStep={2}
            />
          </>
        )}
        <CollapsibleBlock label={t('editor:properties.model.transform.resourceOverrides')}>
          <PaginatedList
            list={transformParms.resources.images}
            element={(image: State<ImageTransformParameters>) => {
              return (
                <>
                  <div style={{ width: '100%' }}>
                    <InputGroup name="Resource" label={image.resourceId.value}>
                      <BooleanInput value={image.enabled.value} onChange={onChangeTransformParm(image.enabled)} />
                    </InputGroup>
                  </div>
                  {image.enabled.value && (
                    <div style={{ width: '100%' }}>
                      <BooleanInput
                        value={image.parameters.textureFormat.enabled.value}
                        onChange={onChangeTransformParm(image.parameters.textureFormat.enabled)}
                      />
                      <InputGroup name="Texture Format" label={t('editor:properties.model.transform.textureFormat')}>
                        {image.parameters.textureFormat.enabled.value && (
                          <SelectInput
                            value={image.parameters.textureFormat.parameters.value}
                            onChange={onChangeTransformParm(image.parameters.textureFormat)}
                            options={[
                              { label: 'Default', value: 'default' },
                              { label: 'JPG', value: 'jpg' },
                              { label: 'KTX2', value: 'ktx2' },
                              { label: 'PNG', value: 'png' },
                              { label: 'WebP', value: 'webp' }
                            ]}
                          />
                        )}
                      </InputGroup>
                      <BooleanInput
                        value={image.parameters.maxTextureSize.enabled.value}
                        onChange={onChangeTransformParm(image.parameters.maxTextureSize.enabled)}
                      />
                      <InputGroup name="Max Texture Size" label={t('editor:properties.model.transform.maxTextureSize')}>
                        {image.parameters.maxTextureSize.enabled.value && (
                          <NumericInput
                            value={image.parameters.maxTextureSize.parameters.value}
                            onChange={onChangeTransformParm(image.parameters.maxTextureSize)}
                            max={4096}
                            min={64}
                          />
                        )}
                      </InputGroup>
                      <BooleanInput
                        value={image.parameters.textureCompressionType.enabled.value}
                        onChange={onChangeTransformParm(image.parameters.textureCompressionType.enabled)}
                      />
                      <InputGroup
                        name="Texture Compression Type"
                        label={t('editor:properties.model.transform.textureCompressionType')}
                      >
                        {image.parameters.textureCompressionType.enabled.value && (
                          <SelectInput
                            value={image.parameters.textureCompressionType.parameters.value}
                            onChange={onChangeTransformParm(image.parameters.textureCompressionType)}
                            options={[
                              { label: 'UASTC', value: 'uastc' },
                              { label: 'ETC1', value: 'etc1' }
                            ]}
                          />
                        )}
                      </InputGroup>
                      <BooleanInput
                        value={image.parameters.textureCompressionQuality.enabled.value}
                        onChange={onChangeTransformParm(image.parameters.textureCompressionQuality.enabled)}
                      />
                      <InputGroup name="KTX2 Quality" label={t('editor:properties.model.transform.ktx2Quality')}>
                        {image.parameters.textureCompressionQuality.enabled.value && (
                          <NumericInput
                            value={image.parameters.textureCompressionQuality.parameters.value}
                            onChange={onChangeTransformParm(image.parameters.textureCompressionQuality)}
                            max={255}
                            min={1}
                            smallStep={1}
                            mediumStep={1}
                            largeStep={2}
                          />
                        )}
                      </InputGroup>
                      <BooleanInput
                        value={image.parameters.flipY.enabled.value}
                        onChange={onChangeTransformParm(image.parameters.flipY.enabled)}
                      />
                      <InputGroup name="Flip Y" label={t('editor:properties.model.transform.flipY')}>
                        {image.parameters.flipY.enabled.value && (
                          <BooleanInput
                            value={image.parameters.flipY.parameters.value}
                            onChange={onChangeTransformParm(image.parameters.flipY)}
                          />
                        )}
                      </InputGroup>
                    </div>
                  )}
                </>
              )
            }}
          />
        </CollapsibleBlock>
      </div>
    </CollapsibleBlock>
  )
}
