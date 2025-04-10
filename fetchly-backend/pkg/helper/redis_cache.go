package helper

import (
	"log"

	"github.com/gomodule/redigo/redis"
)

func GetRedisCache(redisPool *redis.Pool, redisKey string) (string, error) {
	conn := redisPool.Get()
	defer conn.Close()

	cache, err := conn.Do("GET", redisKey)
	cacheValue, err := redis.String(cache, err)
	if err != nil {
		return "", err
	}
	return cacheValue, nil
}

func SetRedisCache(redisPool *redis.Pool, redisKey string, redisValue []byte, expireTime int32) error {
	conn := redisPool.Get()
	defer conn.Close()

	if expireTime < 1 {
		expireTime = 86400
	}

	_, errSet := conn.Do("SET", redisKey, string(redisValue)) // set the value to redis key
	if errSet != nil {
		log.Printf("error set redis cache with redisKey: %v, value: %v, errorMessage: %v", redisKey, string(redisValue), errSet)
		return errSet
	} else {
		_, errExpire := conn.Do("EXPIRE", redisKey, expireTime) // set cache available time to be 1 day long (86400 seconds), unless there is any updates to that user
		if errExpire != nil {
			log.Printf("error set redis cache expire time with redisKey: %v, value: %v, errorMessage: %v", redisKey, string(redisValue), errExpire)
			return errExpire
		}
	}
	return nil
}

func SaddRedisCache(redisPool *redis.Pool, redisSetKey string, value []byte) error {
	conn := redisPool.Get()
	defer conn.Close()

	_, err := conn.Do("SADD", redisSetKey, value) // set the value to redis key
	if err != nil {
		log.Printf("error set redis cache with redisKey: %v, value: %v, errorMessage: %v", redisSetKey, value, err)
		return err
	}

	return nil
}

func SmembersRedisCache(redisPool *redis.Pool, redisSetKey string) ([]string, error) {
	conn := redisPool.Get()
	defer conn.Close()

	cache, err := conn.Do("SMEMBERS", redisSetKey)
	cacheValue, err := redis.Strings(cache, err)
	if err != nil {
		return nil, err
	}
	return cacheValue, nil
}

func DeleteRedisCache(redisPool *redis.Pool, redisKey string) error {
	conn := redisPool.Get()
	defer conn.Close()

	_, err := conn.Do("DEL", redisKey) // delete the value of redis key
	if err != nil {
		log.Printf("error delete redis cache with redisKey: %v, errorMessage: %v", redisKey, err)
		return err
	}
	return nil
}

func RevalidateSearchUserCache(redisPool *redis.Pool) error {
	conn := redisPool.Get()
	defer conn.Close()

	setKey := "user_list"

	userList, err := redis.Strings(conn.Do("SMEMBERS", setKey))
	if err != nil {
		log.Printf("error RevalidateSearchUserCache SMEMBERS user_list, errorMessage: %v", err)
	}
	for i := 0; i < len(userList); i++ {
		errDel := DeleteRedisCache(redisPool, userList[i])
		if errDel != nil {
			log.Printf("error RevalidateSearchUserCache DEL %v, errorMessage: %v", userList[i], err)
		}

		_, errSrem := conn.Do("SREM", setKey, userList[i])
		if errSrem != nil {
			log.Printf("error RevalidateSearchUserCache SREM %v %v, errorMessage: %v", setKey, userList[i], err)
		}
	}

	return nil
}

func GetIncrementValue(redisPool *redis.Pool, redisKey string) int32 {
	if redisKey == "" {
		return 0
	}

	conn := redisPool.Get()
	defer conn.Close()

	number, err := conn.Do("INCR", redisKey)
	numberValue, err := redis.Int64(number, err)
	if err != nil {
		return 0
	}
	log.Print(numberValue)
	return int32(numberValue)
}
