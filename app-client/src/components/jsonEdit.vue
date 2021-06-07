<template>
  <v-card light class="elevation-12">
    <v-card-title>
      <div>{{ this.isedit ? "Edit" : "New" }} {{ getObjectName }}</div>
    </v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-container grid-list-xs>
          <v-row>
            <v-col
              v-for="itm in editlayout"
              :key="itm.value"
              cols="12"
              sm="6"
              lg="3"
            >
              <v-checkbox
                v-if="itm.type == 'bool'"
                v-model="editdata[itm.value]"
                :label="itm.text"
              ></v-checkbox>
              <v-file-input
                v-if="itm.type == 'file'"
                v-model="editdata[itm.value]"
                :label="itm.text"
              ></v-file-input>
              <v-radio-group
                v-if="itm.type == 'code'"
                v-model="editdata[itm.value]"
              >
                <v-radio v-for="n in itm.code" :key="n.value" :label="n.text">
                </v-radio>
              </v-radio-group>
              <v-select
                v-if="itm.type == 'select'"
                v-model="editdata[itm.value]"
                :items="itm.code"
                :label="itm.text"
              ></v-select>
              <v-select
                v-if="
                  itm.type == 'reference' && itm.code && itm.code.length == 1
                "
                v-model="editdata[itm.value]"
                :items="itm.refitems"
                item-value="value"
                item-text="text"
                :label="itm.text"
              ></v-select>
              <v-slider
                v-if="itm.type == 'number' && itm.code && itm.code.length == 2"
                v-model="editdata[itm.value]"
                :min="itm.code[0]"
                :max="itm.code[1]"
                :label="itm.text"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="editdata[itm.value]"
                    class="mt-0 pt-0"
                    type="number"
                    style="width: 60px"
                  ></v-text-field>
                </template>
              </v-slider>
              <v-menu
                v-if="itm.type == 'date'"
                v-model="itm[itm.value + '_picker']"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="editdata[itm.value]"
                    :label="itm.text"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="editdata[itm.value]"
                  @input="itm[value + '_picker'] = false"
                ></v-date-picker>
              </v-menu>
              <v-menu
                v-if="itm.type == 'time'"
                :ref="itm.value + '_picker'"
                v-model="itm[itm.value + '_picker']"
                :close-on-content-click="false"
                :nudge-right="40"
                :return-value.sync="editdata[itm.value]"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="editdata[itm.value]"
                    :label="itm.text"
                    prepend-icon="mdi-clock-time-four-outline"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-time-picker
                  v-if="itm[value + '_picker']"
                  v-model="editdata[itm.value]"
                  full-width
                  @click:minute="inputTime(itm.value)"
                ></v-time-picker>
              </v-menu>
              <v-textarea
                v-if="itm.type == 'textarea'"
                v-model="editdata[itm.value]"
                :label="itm.text"
                rows="1"
              ></v-textarea>
              <v-text-field
                v-if="
                  itm.type == 'text' ||
                  (itm.type == 'number' &&
                    (!itm.code || itm.code.length != 2)) ||
                  itm.type == 'email' ||
                  itm.type == 'password' ||
                  itm.type == 'tel' ||
                  itm.type == 'url' ||
                  (itm.type == 'reference' &&
                    (!itm.code || itm.code.length != 1))
                "
                v-model="editdata[itm.value]"
                :label="itm.text"
                :type="itm.type"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="saveEdit">save</v-btn>
      <v-btn color="secondary" @click="closeEdit">cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    objectname: String,
    jsondata: Object,
  },
  data() {
    return {
      id: null,
      isedit: false,
      editlayout: [],
      editdata: {},
      valid: true,
    };
  },
  computed: {
    getObjectName() {
      return this.$uiconfig.getName(this.$props.objectname);
    },
  },
  beforeMount() {
    this.getEditConfig();

    if (this.$props.jsondata && this.$props.jsondata.id) {
      this.isedit = true;
      this.id = this.$props.jsondata.id;
      this.loadEdit();
    } else {
      this.isedit = false;
      this.editdata = {};
    }
  },
  methods: {
    getEditConfig() {
      this.editlayout = this.$uiconfig.getLayout(this.$props.objectname);
      for (let itm of this.editlayout) {
        if (itm.type == "number") {
          if (itm.code && itm.code.length > 0) {
            this.editdata[itm.value] = itm.code[0];
          } else {
            this.editdata[itm.value] = "";
          }
        } else if (itm.type == "date" || itm.type == "time") {
          itm[itm.value + "_picker"] = false;
        } else if (
          itm.type == "reference" &&
          itm.code &&
          itm.code.length == 1
        ) {
          this.getRefItems(itm);
        }
      }
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
    inputTime(name) {
      this.$refs[name + "_picker"][0].save(this.editdata[name]);
      this.editlayout[name + "_picker"] = false;
    },
    loadEdit() {
      this.$axios
        .get(`/api/master/${this.$props.objectname}/${this.id}`)
        .then((r) => {
          if (r && r.data) {
            const d = JSON.parse(r.data);
            if (d.length > 0 && d[0].fields) {
              return (this.editdata = d[0].fields);
            }
          }
          return (this.editdata = {});
        })
        .catch((e) => {
          console.log(e);
        });
    },
    closeEdit() {
      this.$emit("close-editor", false);
    },
    saveEdit() {
      if (this.isedit) {
        this.$axios
          .put(`/api/master/${this.$props.objectname}`, {
            id: this.id,
            fields: this.editdata,
          })
          .then((r) => {
            console.log(r);
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        this.$axios
          .post(`/api/master/${this.$props.objectname}`, this.editdata)
          .then((r) => {
            console.log(r);
          })
          .catch((e) => {
            console.log(e);
          });
      }
      this.$emit("close-editor", true);
    },
  },
};
</script>

<style scoped>
.e4 {
  width: 400px;
  margin: auto;
}
</style>
