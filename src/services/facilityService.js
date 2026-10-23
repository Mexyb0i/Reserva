import { facilities, timeslots } from '../data/mockData'

const wait = (value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 160)
  })

export const facilityService = {
  async getFacilities() {
    return wait([...facilities])
  },

  async searchFacilities({ query = '', category = 'All' } = {}) {
    const normalizedQuery = query.trim().toLowerCase()
    return wait(
      facilities.filter((facility) => {
        const matchesCategory = category === 'All' || facility.sport === category
        const matchesQuery =
          !normalizedQuery ||
          `${facility.name} ${facility.sport}`.toLowerCase().includes(normalizedQuery)
        return matchesCategory && matchesQuery
      }),
    )
  },

  async getFacilityById(id) {
    return wait(facilities.find((item) => item.id === Number(id)))
  },

  async getAvailability() {
    return wait(timeslots.map((slot) => ({ ...slot })))
  },
}
