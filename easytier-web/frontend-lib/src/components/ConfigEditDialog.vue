<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { NetworkConfig } from '../types/network';
import { Divider, Button, Dialog, Textarea } from 'primevue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    readonly?: boolean
    generateConfig: (config: NetworkConfig) => Promise<string>
    saveConfig: (config: string) => Promise<void>
}>(), {
    readonly: false,
})

const curNetwork = defineModel('curNetwork', {
    type: Object as () => NetworkConfig | undefined,
    required: true,
})

const tomlConfig = ref<string>('')
const tomlConfigRows = ref<number>(1);
const errorMessage = ref<string>('');
let refreshSeq = 0;

const refreshTomlConfig = async (config: NetworkConfig | undefined) => {
    const seq = ++refreshSeq;
    if (!config) {
        tomlConfig.value = '';
        return;
    }

    try {
        errorMessage.value = '';
        const generated = await props.generateConfig(config);
        if (seq !== refreshSeq || !visible.value) {
            return;
        }
        tomlConfig.value = generated;
    } catch (e) {
        if (seq !== refreshSeq || !visible.value) {
            return;
        }
        tomlConfig.value = '';
        errorMessage.value = 'Failed to generate config: ' + (e instanceof Error ? e.message : String(e));
    }
}

const visible = defineModel('visible', {
    type: Boolean,
    default: false,
})
watch([visible, () => curNetwork.value?.instance_id], async ([newVisible]) => {
    if (!newVisible) {
        refreshSeq++;
        tomlConfig.value = '';
        return;
    }
    await refreshTomlConfig(curNetwork.value);
})
onMounted(async () => {
    if (!visible.value) {
        return;
    }
    await refreshTomlConfig(curNetwork.value);
});

const handleConfigSave = async () => {
    if (props.readonly) return;
    try {
        await props.saveConfig(tomlConfig.value);
        visible.value = false;
    } catch (e) {
        errorMessage.value = 'Failed to save config: ' + (e instanceof Error ? e.message : String(e));
    }
};

watch(tomlConfig, (newValue) => {
    tomlConfigRows.value = newValue.split('\n').length;
    errorMessage.value = '';
});

</script>
<template>
    <Dialog v-model:visible="visible" modal :header="t('config_file')" :style="{ width: '70%' }">
        <pre v-if="errorMessage"
            class="mb-2 p-2 rounded text-sm overflow-auto bg-red-100 text-red-700 max-h-40">{{ errorMessage }}</pre>
        <div class="flex w-full" style="max-height: 60vh; overflow-y: auto;">
            <Textarea v-model="tomlConfig" class="w-full h-full font-mono flex flex-col resize-none" :rows="tomlConfigRows"
                spellcheck="false" :readonly="props.readonly"></Textarea>
        </div>
        <Divider />
        <div class="flex gap-2 justify-end">
            <Button v-if="!props.readonly" type="button" :label="t('save')" @click="handleConfigSave" />
            <Button type="button" :label="t('close')" @click="visible = false" />
        </div>
    </Dialog>
</template>
