import { mockReviews } from './src/data/mockReviews.js'
import { sentimentDictionary } from './src/data/sentimentDictionary.js'

const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      sentiment: '中性',
      sentimentColor: '#9CA3AF',
      positiveWords: [],
      negativeWords: [],
      intensity: 1
    }
  }

  const { positiveWords, negativeWords, intensifiers } = sentimentDictionary
  
  let score = 0
  let positiveMatches = []
  let negativeMatches = []
  let intensity = 1

  const lowerText = text.toLowerCase()

  for (const [word, factor] of Object.entries(intensifiers)) {
    if (lowerText.includes(word)) {
      intensity *= factor
    }
  }

  const compoundNegativeWords = negativeWords.filter(w => w.length > 2 && w.startsWith('不'))
  
  compoundNegativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      negativeMatches.push(word)
      score -= 1 * intensity
    }
  })

  const intensifiedNegativeWords = negativeWords.filter(w => w.length <= 2)
  intensifiedNegativeWords.forEach(word => {
    if (lowerText.includes('太' + word) || lowerText.includes(word)) {
      if (!negativeMatches.includes(word)) {
        negativeMatches.push(word)
        score -= 1 * intensity
      }
    }
  })

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      const wordIndex = lowerText.indexOf(word)
      const searchStart = Math.max(0, wordIndex - 2)
      const prefix = lowerText.substring(searchStart, wordIndex)
      
      const hasNegation = prefix.endsWith('不') || prefix.endsWith('没') || 
                         prefix.endsWith('不太') || prefix.endsWith('没有')
      
      if (hasNegation) {
        if (!negativeMatches.includes(word)) {
          negativeMatches.push(word)
        }
      } else {
        if (!positiveMatches.includes(word)) {
          positiveMatches.push(word)
          score += 1 * intensity
        }
      }
    }
  })

  const totalMatches = positiveMatches.length + negativeMatches.length
  const maxScore = totalMatches * intensity || 1
  let normalizedScore = score / maxScore

  if (positiveMatches.length > 0 && negativeMatches.length > 0) {
    const posCount = positiveMatches.length
    const negCount = negativeMatches.length
    
    if (posCount >= negCount * 2) {
      normalizedScore *= 0.9
    } else if (negCount >= posCount * 2) {
      normalizedScore *= 0.9
    } else if (posCount >= negCount * 1.5) {
      normalizedScore *= 0.7
    } else if (negCount >= posCount * 1.5) {
      normalizedScore *= 0.7
    } else {
      normalizedScore *= 0.5
    }
  }

  let sentiment, sentimentColor
  if (normalizedScore > 0.35) {
    sentiment = '正面'
    sentimentColor = '#10B981'
  } else if (normalizedScore < -0.35) {
    sentiment = '负面'
    sentimentColor = '#EF4444'
  } else {
    sentiment = '中性'
    sentimentColor = '#9CA3AF'
  }

  return {
    score: normalizedScore,
    sentiment,
    sentimentColor,
    positiveWords: positiveMatches,
    negativeWords: negativeMatches,
    intensity
  }
}

console.log('=== 所有评论情感分析测试 ===\n')

let correct = 0
let wrong = 0
let neutral = 0

mockReviews.forEach((review, index) => {
  const result = analyzeSentiment(review.content)
  
  let expected = '中性'
  if (review.rating >= 4) expected = '正面'
  if (review.rating <= 2) expected = '负面'
  if (review.rating === 3) expected = '中性'
  
  const isCorrect = expected === result.sentiment
  
  console.log(`${index + 1}. ${review.userName} (${review.rating}星)`)
  console.log(`   内容: ${review.content}`)
  console.log(`   预期: ${expected} | 实际: ${result.sentiment} (分数: ${result.score.toFixed(3)})`)
  console.log(`   正面词: [${result.positiveWords.join(', ')}]`)
  console.log(`   负面词: [${result.negativeWords.join(', ')}]`)
  
  if (!isCorrect) {
    console.log('   ⚠️ 分类错误！')
    wrong++
  } else if (result.sentiment === '中性') {
    neutral++
    correct++
  } else {
    correct++
  }
  console.log()
})

console.log('=== 统计结果 ===')
console.log(`总评论数: ${mockReviews.length}`)
console.log(`正确: ${correct}`)
console.log(`错误: ${wrong}`)
console.log(`中性(模糊): ${neutral}`)
console.log(`准确率: ${((correct / mockReviews.length) * 100).toFixed(1)}%`)
