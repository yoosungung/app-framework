<template>
  <v-container fluid fill-height grid-list-xs>
    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="300">
        <v-toolbar dark color="primary">
          <v-toolbar-title>SignIn</v-toolbar-title>
        </v-toolbar>
        <v-card light class="elevation-12">
          <v-card-title>to your workspace</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                prepend-icon="mdi-account"
                v-model="form.id"
                label="Id"
                type="text"
              ></v-text-field>
              <v-text-field
                v-if="check_signup"
                prepend-icon="mdi-account-multiple"
                v-model="form.grp"
                label="Group"
                type="text"
              ></v-text-field>
              <v-text-field
                v-if="check_signup"
                prepend-icon="mdi-account"
                v-model="form.fullname"
                label="Full Name"
                type="text"
              ></v-text-field>
              <v-text-field
                v-if="check_signup"
                prepend-icon="mdi-email"
                v-model="form.email"
                label="eMail"
                type="text"
              ></v-text-field>
              <v-text-field
                prepend-icon="mdi-lock"
                v-model="form.password"
                label="Password"
                type="password"
              ></v-text-field>
              <v-checkbox
                v-model="check_signup"
                label="If not registed then Singn Up !"
              ></v-checkbox>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="signin">signin</v-btn>
            <v-btn color="secondary" @click="reset">cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn v-show="check_signup" color="error" @click="signup"
              >signup</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      form: {
        id: "",
        grp: "",
        fullname: "",
        email: "",
        password: "",
      },
      valid: true,
      dialog: true,
      check_signup: false,
    };
  },
  beforeMount() {
    const user = this.$store.state.user;
    this.form.id = user.id;
    this.form.password = "";
  },
  methods: {
    signin() {
      this.$axios
        .post(
          "/sign/in",
          JSON.stringify({
            id: this.form.id,
            password: this.form.password,
          })
        )
        .then((r) => {
          this.$store.commit("setUser", JSON.parse(r.data).data);
          this.$router.push({ name: "Home", path: "/" });
        })
        .catch((e) => {
          console.log(e);
          this.$emit("server-error", e);
        });
    },
    reset() {
      this.$refs.form.reset();
    },
    signup() {
      this.$axios
        .post(
          "/sign/up",
          JSON.stringify({
            id: this.form.id,
            grp: this.form.grp,
            fullname: this.form.fullname,
            email: this.form.email,
            password: this.form.password,
          })
        )
        .then((r) => {
          console.log(r);
          this.$router.push({ name: "Signin", path: "/signin" });
        })
        .catch((e) => {
          console.log(e);
          this.$emit("server-error", e);
        });
    },
  },
};
</script>

<style>
</style>