<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" sm="5">
        <v-select
          class="font-weight-black"
          :items="visible"
          v-model="selectvisible"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="7">
        <v-toolbar flat>
          <v-text-field
            v-model="search"
            label="Search"
            single-line
            hide-details
            append-icon="mdi-magnify"
          ></v-text-field>
          <v-btn icon><v-icon @click="OpenEdit(null)">mdi-plus</v-icon></v-btn>
          <v-dialog v-model="dialog" persistent>
            <jedit
              v-if="dialog"
              :objectname="$props.objectname"
              :jsondata="editdata"
              v-on:close-editor="onCloseEdit"
            />
          </v-dialog>
          <v-btn icon><v-icon>mdi-filter</v-icon></v-btn>
        </v-toolbar>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-data-table
          :loading="dataloading"
          :search="search"
          :headers="headers"
          :items="items"
          :items-per-page="5"
          class="elevation-2"
        >
          <template v-slot:item.owner="{ item }">
            {{ ShowUser(item) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small @click="ShowDetail(item)">mdi-file-document</v-icon>
            &nbsp;
            <v-icon small @click="OpenEdit(item)">mdi-pencil</v-icon>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import jedit from "@/components/jsonEdit.vue";
export default {
  props: { objectname: String },
  components: { jedit },
  data() {
    return {
      visible: [],
      selectvisible: "owner",
      search: "",
      dataloading: false,
      headers: [],
      items: [],
      dialog: false,
      editdata: null,
    };
  },
  watch: {
    $route: "getPageConfig",
    selectvisible: "getQryData",
  },
  beforeMount() {
    this.getPageConfig();
  },
  methods: {
    getPageConfig() {
      this.visible = this.$uiconfig.getVisible(this.$props.objectname);
      this.selectvisible = "owner";

      this.headers = this.$uiconfig.getListHeaders(this.$props.objectname);
      for (let itm of this.headers) {
        if (itm.type == "reference" && itm.code && itm.code.length == 1) {
          this.getRefItems(itm);
        }
      }

      this.getQryData();
    },
    getQryData() {
      this.dataloading = true;
      this.$axios
        .get(`/api/summary/master/${this.$props.objectname}`, {
          params: { visible: this.selectvisible },
        })
        .then((r) => {
          if (r.data) {
            const rows = JSON.parse(r.data);
            if (rows.length > 0) {
              this.items = rows;
            } else {
              this.items = [];
            }
          } else {
            this.items = [];
          }
        })
        .catch((e) => {
          console.log(e);
          this.items = [];
        });
      this.dataloading = false;
    },
    getRefItems(itm) {
      this.$axios
        .get(`/api/code/${itm.code[0].object}`, {
          params: { value: itm.code[0].value, text: itm.code[0].text },
        })
        .then((r) => {
          itm.refitems = JSON.parse(r.data);
        })
        .catch((e) => {
          console.log(e);
          itm.refitems = [];
        });
    },
    ShowUser(data) {
      const owner = this.headers.find((v) => {
        return v.value == "owner";
      });
      return owner.refitems.find((v) => {
        return v.value == data.owner;
      }).text;
    },
    ShowDetail(data) {
      this.$router.push(`/${this.$props.objectname}/Detail/${data.id}`);
    },
    OpenEdit(data) {
      this.editdata = data;
      this.dialog = true;
    },
    onCloseEdit(refresh) {
      this.dialog = false;
      if (refresh) {
        this.getQryData();
      }
    },
  },
};
</script>

<style>
</style>