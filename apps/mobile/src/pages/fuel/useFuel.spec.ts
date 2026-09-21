import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFuel } from './useFuel'
const mocks = vi.hoisted(() => ({ stations: vi.fn(), prices: vi.fn(), locate: vi.fn(), unload: vi.fn() }))
vi.mock('@dcloudio/uni-app', () => ({ onShow: vi.fn(), onPullDownRefresh: vi.fn(), onReachBottom: vi.fn(), onUnload: mocks.unload }))
vi.mock('@/api/outdoor', () => ({ outdoorApi: { fuelStations: mocks.stations, fuelPrices: mocks.prices } }))
vi.mock('@/common/userLocation', () => ({ useUserLocation: () => ({ ensureLocation: mocks.locate, openLocationSettings: vi.fn(), status: { value: 'ready' } }) }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ city: { code: '420100' } }) }))
const point = { latitude: 30.5, longitude: 114.3 }
const result = (id: string, page = 1) => ({ items: [{ id }], total: 60, page, pageSize: 5, hasMore: true })
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('uni', { stopPullDownRefresh: vi.fn() })
  mocks.locate.mockResolvedValue(point)
  mocks.prices.mockResolvedValue({ items: [], source: 'empty', updatedAt: '' })
  mocks.stations.mockResolvedValue(result('tx-new'))
})
describe('useFuel real-time location search', () => {
  it('waits for location and forwards its coordinates', async () => {
    const fuel = useFuel()
    await fuel.loadFuel()
    expect(mocks.stations).toHaveBeenCalledWith(point, 1)
    expect(fuel.stationState.value).toBe('ready')
  })
  it('shows permission state without requesting stations on denial', async () => {
    mocks.locate.mockResolvedValue(null)
    const fuel = useFuel()
    await fuel.loadFuel()
    expect(mocks.stations).not.toHaveBeenCalled()
    expect(fuel.stationState.value).toBe('denied')
  })
  it('shows a retryable error without mock stations', async () => {
    mocks.stations.mockRejectedValueOnce(new Error('offline'))
    const fuel = useFuel()
    await fuel.loadFuel()
    expect(fuel.stationState.value).toBe('error')
    expect(fuel.stations.value).toEqual([])
    expect(fuel.loading.value).toBe(false)
  })
  it('does not let an old page append after a fresh location search', async () => {
    const fuel = useFuel()
    await fuel.loadFuel()
    let finish!: (value: ReturnType<typeof result>) => void
    mocks.stations.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const more = fuel.loadMore()
    await fuel.loadFuel()
    finish(result('tx-old', 2))
    await more
    expect(fuel.stations.value.map(s => s.id)).toEqual(['tx-new'])
  })
  it('allows fetching another page when upstream filtering removed the entire first page', async () => {
    mocks.stations.mockResolvedValueOnce({ ...result('unused'), items: [] })
    const fuel = useFuel()
    await fuel.loadFuel()
    expect(fuel.stationState.value).toBe('empty')
    await fuel.loadMore()
    expect(mocks.stations).toHaveBeenLastCalledWith(point, 2)
    expect(fuel.stationState.value).toBe('ready')
  })
  it('ignores an in-flight response after leaving the page', async () => {
    const fuel = useFuel()
    let finish!: (value: ReturnType<typeof result>) => void
    mocks.stations.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const pending = fuel.loadFuel()
    await vi.waitFor(() => expect(mocks.stations).toHaveBeenCalled())
    mocks.unload.mock.calls[0][0]()
    finish(result('tx-late'))
    await pending
    expect(fuel.stations.value).toEqual([])
  })
})
