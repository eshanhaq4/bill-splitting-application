package com.billsplit.backend.service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

@Service
public class RedisQueueService {
    private final StringRedisTemplate stringRedisTemplate;

    public RedisQueueService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void enqueue(String queueName, String message) {
        stringRedisTemplate.opsForList().rightPush(queueName, message);
    }

    public String dequeue(String queueName, long timeoutSeconds) {
        return stringRedisTemplate.opsForList().leftPop(queueName, Duration.ofSeconds(timeoutSeconds));
    }

    public void setValue(String key, String value, Duration timeout) {
        stringRedisTemplate.opsForValue().set(key, value, timeout);
    }

    public String getValue(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    public long getQueueLength(String queueName) {
        return stringRedisTemplate.opsForList().size(queueName);
    }

    public Boolean deleteKey(String key) {
        return stringRedisTemplate.delete(key);
    }
}