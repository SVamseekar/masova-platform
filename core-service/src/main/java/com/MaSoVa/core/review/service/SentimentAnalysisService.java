package com.MaSoVa.core.review.service;

import com.MaSoVa.core.review.entity.Review;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SentimentAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(SentimentAnalysisService.class);

    // Simple keyword-based sentiment analysis
    // In production, you would use a proper NLP library or API

    private static final Set<String> POSITIVE_KEYWORDS = new HashSet<>(Arrays.asList(
            "excellent", "amazing", "great", "wonderful", "fantastic", "delicious", "perfect",
            "outstanding", "best", "loved", "incredible", "superb", "awesome", "brilliant",
            "exceptional", "impressive", "fresh", "tasty", "yummy", "flavorful", "good",
            "nice", "quality", "recommend", "happy", "satisfied", "pleased"
    ));

    private static final Set<String> NEGATIVE_KEYWORDS = new HashSet<>(Arrays.asList(
            "terrible", "awful", "bad", "worst", "horrible", "disgusting", "poor", "disappointing",
            "unacceptable", "cold", "stale", "burnt", "raw", "overcooked", "undercooked",
            "salty", "bland", "tasteless", "soggy", "late", "slow", "rude", "dirty",
            "never", "waste", "refund", "complaint", "angry", "unhappy"
    ));

    public Review.SentimentType analyzeSentiment(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Review.SentimentType.NEUTRAL;
        }

        String lowerText = text.toLowerCase();
        int positiveScore = 0;
        int negativeScore = 0;

        // Count positive and negative keywords
        for (String keyword : POSITIVE_KEYWORDS) {
            if (lowerText.contains(keyword)) {
                positiveScore++;
            }
        }

        for (String keyword : NEGATIVE_KEYWORDS) {
            if (lowerText.contains(keyword)) {
                negativeScore++;
            }
        }

        // Determine sentiment
        if (positiveScore > negativeScore + 1) {
            return Review.SentimentType.POSITIVE;
        } else if (negativeScore > positiveScore + 1) {
            return Review.SentimentType.NEGATIVE;
        } else if (positiveScore > 0 && negativeScore > 0) {
            return Review.SentimentType.MIXED;
        } else {
            return Review.SentimentType.NEUTRAL;
        }
    }

    public Double calculateSentimentScore(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0.0;
        }

        String lowerText = text.toLowerCase();
        int positiveScore = 0;
        int negativeScore = 0;

        for (String keyword : POSITIVE_KEYWORDS) {
            if (lowerText.contains(keyword)) {
                positiveScore++;
            }
        }

        for (String keyword : NEGATIVE_KEYWORDS) {
            if (lowerText.contains(keyword)) {
                negativeScore++;
            }
        }

        int totalScore = positiveScore + negativeScore;
        if (totalScore == 0) {
            return 0.0;
        }

        // Score from -1.0 (very negative) to +1.0 (very positive)
        double score = (double) (positiveScore - negativeScore) / totalScore;
        return Math.max(-1.0, Math.min(1.0, score));
    }

    public List<String> extractCommonThemes(List<String> comments) {
        Map<String, Integer> themeCount = new HashMap<>();

        for (String comment : comments) {
            if (comment == null || comment.trim().isEmpty()) {
                continue;
            }

            String lowerComment = comment.toLowerCase();

            // Check for common themes
            if (containsAny(lowerComment, Arrays.asList("spicy", "hot", "spice"))) {
                themeCount.merge("Spice Level", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("portion", "size", "quantity"))) {
                themeCount.merge("Portion Size", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("cold", "warm", "temperature"))) {
                themeCount.merge("Temperature", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("late", "delay", "time", "slow"))) {
                themeCount.merge("Delivery Time", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("fresh", "quality", "ingredient"))) {
                themeCount.merge("Food Quality", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("service", "staff", "friendly", "polite"))) {
                themeCount.merge("Service", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("price", "value", "expensive", "cheap"))) {
                themeCount.merge("Pricing", 1, Integer::sum);
            }
            if (containsAny(lowerComment, Arrays.asList("packaging", "presentation", "packed"))) {
                themeCount.merge("Packaging", 1, Integer::sum);
            }
        }

        // Return top themes
        return themeCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    public Map<String, Long> analyzeSentimentDistribution(List<Review> reviews) {
        Map<String, Long> distribution = new HashMap<>();
        distribution.put("POSITIVE", 0L);
        distribution.put("NEGATIVE", 0L);
        distribution.put("NEUTRAL", 0L);
        distribution.put("MIXED", 0L);

        for (Review review : reviews) {
            if (review.getSentiment() != null) {
                distribution.merge(review.getSentiment().name(), 1L, Long::sum);
            }
        }

        return distribution;
    }
}
