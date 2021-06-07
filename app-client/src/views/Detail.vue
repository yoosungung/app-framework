<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title primary-title>
            <div>{{ objecttype }} : {{ objectdata.title }}</div>
            <v-spacer></v-spacer>
            <v-card-actions>
              <v-btn icon @click="viewEdit = true">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon @click="viewSnackbar = true">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-snackbar v-model="viewSnackbar" light top>
                <h3>{{ `DELETE ${objecttype} : ${objectdata.title} ?` }}</h3>
                <template v-slot:action="{ attrs }">
                  <v-btn color="error" text v-bind="attrs" @click="deleteData">
                    Delete
                  </v-btn>
                  <br />
                  <v-btn
                    color="success"
                    text
                    v-bind="attrs"
                    @click="viewSnackbar = false"
                  >
                    Cancel
                  </v-btn>
                </template>
              </v-snackbar>
            </v-card-actions>
          </v-card-title>
        </v-card>
        <v-dialog v-model="viewEdit" persistent>
          <jedit
            v-if="viewEdit"
            :objectname="$props.objectname"
            :jsondata="objectdata"
            v-on:close-editor="closeForm"
          />
        </v-dialog>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :sm="viewReference ? '7' : '12'">
        <v-card elevation="2">
          <v-card-text>
            <jdetail
              :objectname="$props.objectname"
              :objectconfig="objectfields"
              :jsondata="objectdata"
            />
          </v-card-text>
        </v-card>
        <br />
        <v-card v-if="viewChildren" elevation="2">
          <v-tabs v-model="cldidx">
            <v-tab v-for="cld in chdlist" :key="cld">{{
              $uiconfig.getName(cld)
            }}</v-tab>
            <v-spacer></v-spacer>
            <v-btn icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-tabs>
          <v-tabs-items v-model="cldidx">
            <v-tab-item v-for="cld in chdlist" :key="cld">
              <jchildren> </jchildren>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </v-col>
      <v-col v-if="viewReference" cols="12" sm="5">
        <v-card elevation="2">
          <v-tabs v-model="refidx">
            <v-tab v-for="ref in reflist" :key="ref">{{
              $uiconfig.getName(ref)
            }}</v-tab>
            <v-spacer></v-spacer>
            <v-btn icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-tabs>
          <v-tabs-items v-model="refidx">
            <v-tab-item v-for="ref in reflist" :key="ref">
              <jreference> </jreference>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import jdetail from "@/components/jsonDetail.vue";
import jedit from "@/components/jsonEdit.vue";
import jchildren from "@/components/jsonChildren.vue";
import jreference from "@/components/jsonReference.vue";

export default {
  props: {
    objectname: String,
    objectid: String,
  },
  components: {
    jdetail,
    jedit,
    jchildren,
    jreference,
  },
  data() {
    return {
      objecttype: "",
      objectdata: {},
      objectfields: [],

      reflist: [],
      refidx: null,
      viewReference: false,

      chdlist: [],
      cldidx: null,
      viewChildren: false,

      viewEdit: false,

      viewSnackbar: false,
    };
  },

  watch: {
    $route: "getPageConfig",
  },
  beforeMount() {
    this.getPageConfig();
  },
  methods: {
    getPageConfig() {
      this.objecttype = this.$uiconfig.getName(this.$props.objectname);
      this.objectfields = this.$uiconfig.getLayout(this.$props.objectname);
      for (const itm of this.objectfields) {
        if (itm.type == "reference" && itm.code && itm.code.length == 1) {
          this.getRefItems(itm);
        }
      }
      this.getQryData();

      this.reflist = this.$uiconfig.getReference(this.$props.objectname);
      this.viewReference = this.reflist.length > 0;

      this.cldlist = this.$uiconfig.getChildren(this.$props.objectname);
      this.viewChildren = this.cldlist.length > 0;
    },
    getRefItems(itm) {
      if (!itm.refitems) {
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
      }
    },
    getQryData() {
      this.$axios
        .get(`/api/master/${this.$props.objectname}/${this.$props.objectid}`)
        .then((r) => {
          if (r.data) {
            const d = JSON.parse(r.data);
            if (d.length > 0) {
              const itm = d[0];
              this.objectdata = {
                id: itm.id,
                grp: itm.grp,
                editby: itm.editby,
                editat: itm.editat,
                ...itm.fields,
              };
            } else {
              this.objectdata = {};
            }
          } else {
            this.objectdata = {};
          }
        })
        .catch((e) => {
          console.log(e);
          this.objectdata = {};
        });
    },
    closeForm(refresh) {
      this.viewEdit = false;
      if (refresh) {
        this.getQryData();
      }
    },
    deleteData() {
      this.viewSnackbar = false;
      this.$axios
        .delete(`/api/master/${this.$props.objectname}`, {
          id: this.$props.objectid,
        })
        .then((r) => {
          if (r) {
            this.$root.$children[0].serverOK(
              `Delete "${this.objectdata.title}" (${this.objecttype}) !`
            );
            this.$router.back();
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
};
</script>

<style>
</style>