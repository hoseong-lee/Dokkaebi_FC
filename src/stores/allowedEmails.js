import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  listAllowedEmails,
  addAllowedEmail,
  updateAllowedEmail,
  removeAllowedEmail
} from '@/firebase/database'

export const useAllowedEmailsStore = defineStore('allowedEmails', () => {
  const emails = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      emails.value = (await listAllowedEmails()).sort((a, b) => a.email.localeCompare(b.email))
    } finally {
      loading.value = false
    }
    return emails.value
  }

  async function add(email, role, note) {
    await addAllowedEmail(email, role, note)
    await fetchAll()
  }

  async function toggleActive(item) {
    await updateAllowedEmail(item.email, { active: !item.active })
    await fetchAll()
  }

  async function setRole(item, role) {
    await updateAllowedEmail(item.email, { role })
    await fetchAll()
  }

  async function remove(email) {
    await removeAllowedEmail(email)
    emails.value = emails.value.filter((e) => e.email !== email)
  }

  return { emails, loading, fetchAll, add, toggleActive, setRole, remove }
})
