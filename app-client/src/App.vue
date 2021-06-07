<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="minVariant"
      :clipped="clipped"
      fixed
      app
    >
      <v-list>
        <v-list-item-group v-model="selectedItem" color="primary">
          <v-list-item
            v-for="(item, i) in items"
            :key="i"
            :to="item.to"
            router
            exact
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-btn icon @click.stop="minVariant = !minVariant">
        <v-icon>mdi-{{ `chevron-${minVariant ? "right" : "left"}` }}</v-icon>
      </v-btn>
      <v-toolbar-title v-text="title" />
      <v-spacer></v-spacer>
      <v-text-field
        hide-details
        solo
        append-icon="mdi-magnify"
        placeholder="search"
      ></v-text-field>
      <v-spacer></v-spacer>
      <v-avatar size="24">
        <img v-if="false" src="src" alt="alt" />
        <v-icon v-if="true">mdi-account-circle</v-icon>
      </v-avatar>
      <v-btn icon color="primary" disabled>
        <v-icon>mdi-power</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <v-snackbar v-model="snackbar" :timeout="timeout">
      <div>
        <h3>{{ snackbar_message }}</h3>
        <span>{{ snackbar_detail }}</span>
      </div>
      <template v-slot:action="{ attrs }">
        <v-btn icon dark v-bind="attrs" @click="snackbar = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data: () => ({
    clipped: false,
    drawer: false,
    selectedItem: 0,
    items: [],
    minVariant: false,
    title: "Sales",
    snackbar: false,
    snackbar_message: "Something error !",
    snackbar_detail: "",
    timeout: 2000,
  }),
  created() {
    this.$axios.useInterceptors(this);
  },
  beforeMount() {
    this.items = this.$uiconfig.getMenus();
  },
  methods: {
    serverError(err) {
      if (!err) {
        this.snackbar_message = "call system manager !";
        this.snackbar_detail = "error undefined";
      } else if (!err.response || !err.response.data) {
        this.snackbar_message = "call system manager !";
        this.snackbar_detail = err.message;
      } else {
        const data = JSON.parse(err.response.data);
        if (!data.err || !data.err.message) {
          this.snackbar_message = "Service failed";
          this.snackbar_detail = data;
        } else {
          this.snackbar_message = "Service failed";
          this.snackbar_detail = data.err.message;
        }
      }
      this.snackbar = true;
    },
    serverOK(msg) {
      if (!msg) {
        this.snackbar_message = "OK !";
      } else {
        this.snackbar_message = msg;
      }
      this.snackbar_detail = "";
      this.snackbar = true;
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
