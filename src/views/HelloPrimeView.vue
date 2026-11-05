<script setup lang="ts">
import { ref } from 'vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Rating from 'primevue/rating'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ToggleSwitch from 'primevue/toggleswitch'
import Toolbar from 'primevue/toolbar'
import { useToast } from 'primevue/usetoast'

interface ScheduleRow {
  title: string
  status: string
  severity: 'success' | 'info' | 'warn' | 'danger'
  owner: string
  due: string
}

const toast = useToast()

const name = ref('')
const role = ref('Editor')
const notifications = ref(true)
const autoSave = ref(false)
const volume = ref(60)
const rating = ref(4)
const dialogVisible = ref(false)

const roles = ['Admin', 'Editor', 'Viewer']

const rows = ref<ScheduleRow[]>([
  { title: 'Design review', status: 'Done', severity: 'success', owner: 'Ada', due: 'Today' },
  { title: 'Ship beta', status: 'In progress', severity: 'info', owner: 'Linus', due: 'Tomorrow' },
  { title: 'Update docs', status: 'At risk', severity: 'warn', owner: 'Grace', due: 'Friday' },
  { title: 'Fix login bug', status: 'Blocked', severity: 'danger', owner: 'Alan', due: 'Today' },
])

function notify(): void {
  toast.add({
    severity: 'success',
    summary: 'Saved',
    detail: 'Your settings were saved successfully.',
    life: 3000,
  })
}
</script>

<template>
  <Toast position="bottom-right" />

  <section class="hello">
    <header class="hello__header">
      <div>
        <h1>Hello PrimeVue</h1>
        <p>A quick visual tour of the components now available in this project.</p>
      </div>
      <div class="hello__avatar-group">
        <Avatar label="LS" shape="circle" size="large" />
        <Avatar icon="pi pi-user" shape="circle" size="large" />
        <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" shape="circle" size="large" />
      </div>
    </header>

    <Toolbar>
      <template #start>
        <Button label="New" icon="pi pi-plus" severity="success" />
        <Button label="Upload" icon="pi pi-upload" severity="secondary" outlined class="hello__toolbar-button" />
      </template>
      <template #end>
        <Button label="Search" icon="pi pi-search" text />
        <Button icon="pi pi-cog" rounded text aria-label="Settings" />
      </template>
    </Toolbar>

    <div class="hello__grid">
      <Card>
        <template #title>Buttons</template>
        <template #content>
          <div class="hello__row">
            <Button label="Primary" />
            <Button label="Secondary" severity="secondary" />
            <Button label="Success" severity="success" />
            <Button label="Info" severity="info" />
            <Button label="Warn" severity="warn" />
            <Button label="Danger" severity="danger" />
          </div>
          <Divider />
          <div class="hello__row">
            <Button label="Outlined" outlined />
            <Button label="Text" text />
            <Button label="Raised" raised />
            <Button label="Rounded" rounded />
            <Button icon="pi pi-heart" rounded aria-label="Like" />
            <Button label="Save" icon="pi pi-check" icon-pos="right" @click="notify" />
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Form controls</template>
        <template #content>
          <div class="hello__field">
            <label for="hello-name">Name</label>
            <InputText id="hello-name" v-model="name" placeholder="Type your name" fluid />
          </div>
          <div class="hello__field">
            <label for="hello-role">Role</label>
            <Select id="hello-role" v-model="role" :options="roles" fluid />
          </div>
          <div class="hello__field hello__field--inline">
            <Checkbox id="hello-notifications" v-model="notifications" binary />
            <label for="hello-notifications">Email notifications</label>
          </div>
          <div class="hello__field hello__field--inline">
            <ToggleSwitch id="hello-autosave" v-model="autoSave" />
            <label for="hello-autosave">Auto-save drafts</label>
          </div>
          <div class="hello__field">
            <label for="hello-volume">Volume: {{ volume }}</label>
            <Slider id="hello-volume" v-model="volume" :min="0" :max="100" />
          </div>
          <div class="hello__field">
            <label>Rating</label>
            <Rating v-model="rating" :cancel="false" />
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Feedback & status</template>
        <template #content>
          <div class="hello__row">
            <Tag value="New" severity="success" />
            <Tag value="Beta" severity="info" />
            <Tag value="Warning" severity="warn" />
            <Tag value="Error" severity="danger" />
            <Tag value="Neutral" severity="secondary" />
          </div>
          <Message severity="success" text="Everything is working." />
          <Message severity="info" text="This is an informational message." />
          <Message severity="warn" text="Check your configuration." />
          <Message severity="error" text="Something went wrong." />
          <div class="hello__progress">
            <span>Project progress</span>
            <ProgressBar :value="72" />
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Dialog & toast</template>
        <template #content>
          <p class="hello__muted">Overlays are wired up and ready to use.</p>
          <div class="hello__row">
            <Button label="Open dialog" icon="pi pi-window-maximize" @click="dialogVisible = true" />
            <Button label="Show toast" icon="pi pi-bell" severity="secondary" @click="notify" />
          </div>
          <Dialog v-model:visible="dialogVisible" header="Hello from PrimeVue" modal :style="{ width: '26rem' }">
            <p class="hello__muted">
              Dialogs, toasts, and other overlays are available out of the box.
            </p>
            <template #footer>
              <Button label="Close" text @click="dialogVisible = false" />
              <Button label="Got it" @click="dialogVisible = false" />
            </template>
          </Dialog>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>Data table</template>
      <template #content>
        <DataTable :value="rows" size="small" striped-rows>
          <Column field="title" header="Task" sortable />
          <Column field="status" header="Status" style="width: 9rem">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="data.severity" />
            </template>
          </Column>
          <Column field="owner" header="Owner" style="width: 8rem" />
          <Column field="due" header="Due" style="width: 8rem" />
        </DataTable>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.hello {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hello__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.hello__header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
}

.hello__header p {
  margin: 0;
  color: var(--color-muted);
}

.hello__avatar-group {
  display: flex;
}

.hello__avatar-group :deep(.p-avatar) {
  margin-left: -0.5rem;
  border: 2px solid var(--color-bg);
}

.hello__avatar-group :deep(.p-avatar:first-child) {
  margin-left: 0;
}

.hello__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}

.hello__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.hello__row + .hello__row {
  margin-top: 0.75rem;
}

.hello__toolbar-button {
  margin-left: 0.5rem;
}

.hello__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.hello__field label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.hello__field--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
}

.hello__field--inline label {
  color: var(--color-text);
}

.hello__progress {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
}

.hello__muted {
  color: var(--color-muted);
  margin-top: 0;
}

:deep(.p-card) {
  background: var(--color-surface);
  border-color: var(--color-border);
}

:deep(.p-message) {
  margin-top: 0.75rem;
}
</style>
