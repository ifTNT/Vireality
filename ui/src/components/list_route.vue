<template>
    <div class="container">
        <h1>List of Routes: </h1>
        <div class="content">
            <router-link class="link" v-for="item in items" v-bind:key="item.name" :to="item.path">
                {{item.name}} : {{item.path}}
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    name: 'list_routes',
    mounted() {
        this.$router.options.routes.forEach(route => {
            this.items.push({
                name: route.name
                , path: route.path
            })
        })
    }
    , data() {
        return {
            items: []
        }
    }
}
</script>

<style scoped lang="stylus">
.container
    padding 1em
    box-sizing border-box

    h1
        font-size 2em
        margin-top 0.5em

.content
    display flex
    flex-direction column
    margin-left 2em
    
    .link
        font-size 16px
        margin-top 1em
        display inline-block
        text-decoration none

</style>
