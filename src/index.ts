import Vue, { VNode } from 'vue';
import App from './App.vue';

// Need to create the app this way otherwise hot reloading won't work:
// https://github.com/vuejs/vue-hot-reload-api/issues/61
new Vue({
    render: (createElement): VNode => createElement(App),
}).$mount('#vue-app');
