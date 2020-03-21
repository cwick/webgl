<template>
    <span
        v-bind:title="message"
    >Hover your mouse over me for a few seconds to see my dynamically bound title!</span>
</template>

<script lang="ts">
export default {
    data() {
        return {
            message: 'Hello World',
            models: [],
        };
    },
    async mounted() {
        const response = await fetch(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/model-index.json',
        );
        console.log(await response.json());
    },
    el: '#vue-app',
};
</script>
