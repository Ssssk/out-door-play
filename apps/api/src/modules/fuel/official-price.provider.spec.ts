import { describe, expect, it } from 'vitest'
import {
  parseDieselItems,
  parseGasolineItems,
  parseOfficialPriceArticles,
  parsePublishedAt,
  pickLatestArticleUrl,
} from './official-price.provider'

// 以下正文取自中国价格信息网真实页面（2026-09-19 实测），用于锁定解析口径
const gasolineHtml = `<div class="content"><p>本期（2026年8月26日）全国汽油平均价格中，汽油(92号车用)价格为7.85元/升，环比0.13%；汽油(95号车用)价格为8.37元/升，环比与上期持平；汽油(98号车用)价格为9.60元/升，环比与上期持平。</p></div>`
const dieselHtml = `<div class="content"><p>本期（2026年8月26日）全国柴油平均价格中，柴油(0号车用)价格为7.42元/升，柴油(-10号车用)价格为7.88元/升，环比均与上期持平。</p></div>`

const listHtml = `
<a href="http://www.chinaprice.cn/nyscdt/61330.jhtml">8月第4周全国汽油价格行情</a>
<a href="http://www.chinaprice.cn/nyscdt/61294.jhtml">8月第4周全国柴油价格行情</a>
<a href="http://www.chinaprice.cn/nyscdt/61075.jhtml">8月第1周全国汽油价格行情</a>`

describe('官方油价解析', () => {
  it('从列表页取关键词对应的最新一篇文章地址', () => {
    expect(pickLatestArticleUrl(listHtml, '全国汽油价格行情')).toBe('http://www.chinaprice.cn/nyscdt/61330.jhtml')
    expect(pickLatestArticleUrl(listHtml, '全国柴油价格行情')).toBe('http://www.chinaprice.cn/nyscdt/61294.jhtml')
    expect(pickLatestArticleUrl(listHtml, '全国航煤价格行情')).toBeNull()
  })

  it('解析数据日期', () => {
    expect(parsePublishedAt('本期（2026年8月26日）全国汽油平均价格中')).toEqual(new Date(Date.UTC(2026, 7, 26)))
    expect(parsePublishedAt('没有日期')).toBeNull()
  })

  it('解析汽油三档价格，并把环比换算成元/升', () => {
    const items = parseGasolineItems(gasolineHtml)

    expect(items).toEqual([
      { grade: '92# 汽油', price: 7.85, change: 0.01 },
      { grade: '95# 汽油', price: 8.37, change: 0 },
      { grade: '98# 汽油', price: 9.6, change: 0 },
    ])
  })

  it('柴油篇的环比写在句末，对全部油号生效，且未收录的油号被忽略', () => {
    const items = parseDieselItems(dieselHtml)

    // -10 号柴油不在本项目 grade 枚举内，只保留 0# 柴油
    expect(items).toEqual([{ grade: '0# 柴油', price: 7.42, change: 0 }])
  })

  it('合并汽油与柴油两篇，日期取汽油篇', () => {
    const result = parseOfficialPriceArticles(gasolineHtml, dieselHtml)

    expect(result?.publishedAt).toEqual(new Date(Date.UTC(2026, 7, 26)))
    expect(result?.items.map((item) => item.grade)).toEqual(['92# 汽油', '95# 汽油', '98# 汽油', '0# 柴油'])
  })

  it('正文缺少日期或价格时返回 null，由调用方降级', () => {
    expect(parseOfficialPriceArticles('<p>暂无数据</p>', dieselHtml)).toBeNull()
    expect(parseOfficialPriceArticles('<p>本期（2026年8月26日）</p>', '<p>本期（2026年8月26日）</p>')).toBeNull()
  })
})
