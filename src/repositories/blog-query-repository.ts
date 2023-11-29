import {BlogType, OutputItemsBlogType, OutputBlogType} from "../types/blogs/output";
import {ObjectId, WithId} from "mongodb";
import {blogCollection} from "../db/db";
import {BLogMapper} from "../types/blogs/mapper";
import {isValidObjectId} from "./utils/Objcet(Id)Chek";
import {BlogSortData, BlogsWithIdSortData} from "../types/blogs/input";

import {QueryBlogSortData} from "../types/blogs/query";
import {ConstructorFilter} from "./utils/blog-query/constructorFilter";
import {FilterType, SortType} from "../types/Mongo/params";

export class BlogQueryRepository {
    // Возвращает блоги переработанные в мапере
    static async getAllBlogs(sortData: BlogSortData): Promise<OutputBlogType> {

        const formattedSortData: QueryBlogSortData = {
            searchNameTerm: sortData.searchNameTerm || null,
            sortBy: sortData.sortBy || 'createdAt',
            sortDirection: sortData.sortDirection || 'desc',
            pageNumber: sortData.pageNumber || '1',
            pageSize: sortData.pageSize || '10'
        };

        const findFilter: FilterType | {} = ConstructorFilter.filter_Find(formattedSortData.searchNameTerm);
        const sortFilter: SortType = ConstructorFilter.filter_Sort(formattedSortData.sortBy, formattedSortData.sortDirection);
        const skipFilter: number = ConstructorFilter.filter_Skip(formattedSortData.pageNumber, formattedSortData.pageSize);

        const blogs: WithId<BlogType>[] = await blogCollection
            .find(findFilter)
            .sort(sortFilter)
            .skip(skipFilter)
            .limit(+formattedSortData.pageSize)
            .toArray();

        const totalCount: number = await blogCollection.countDocuments(findFilter);
        const pageCount: number = Math.ceil(totalCount / +formattedSortData.pageSize);

        return {
            pagesCount: pageCount,
            page: +formattedSortData.pageNumber,
            pageSize: +formattedSortData.pageSize,
            totalCount: +totalCount,
            items: blogs.map(BLogMapper)
        }

    }

    // Возвращает блог переработанный в мапере
    static async getBlogById(id: string, sortData: BlogsWithIdSortData): Promise<OutputItemsBlogType | null> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('id no objectID!');
            }

            const formattedSortData = {
                pageNumber: sortData.pageNumber || 1,
                pageSize: sortData.pageSize || 10,
                sortBy: sortData.sortBy || 'createdAt',
                sortDirection: sortData.sortDirection || 'desc'
            };

            const blog: WithId<BlogType> | null = await blogCollection.findOne({_id: new ObjectId(id)});
            return blog ? BLogMapper(blog) : null
        } catch (error) {
            console.log(error);
            return null
        }

    }


    // ⚠️Удаление всех блогов для тестов
    static async deleteAll() {
        await blogCollection.deleteMany({})
    }
}